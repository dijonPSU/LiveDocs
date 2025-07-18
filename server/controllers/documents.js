import { PrismaClient } from "../generated/prisma/client.js";
import Delta from "quill-delta";
const prisma = new PrismaClient();
const SNAPSHOT_INTERVAL = 20;

export async function getDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { collaborators: { some: { userId: req.user.id } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get documents" });
  }
}

export async function createDocument(req, res) {
  const { title, content = {} } = req.body;

  try {
    const document = await prisma.document.create({
      data: { title, content, ownerId: req.user.id },
    });
    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create document" });
  }
}

export async function savePatch(req, res) {
  const { userId, delta, fullContent } = req.body;
  const documentId = req.params.id;

  if (!delta || !fullContent) {
    return res
      .status(400)
      .json({ message: "Delta and full content are required" });
  }

  try {
    // count existing patches
    const patchCount = await prisma.version.count({
      where: { documentId, isSnapshot: false },
    });

    // always save the incoming patch
    const version = await prisma.version.create({
      data: {
        documentId,
        userId,
        diff: delta,
        versionNumber: patchCount + 1,
        isSnapshot: false,
      },
    });

    if ((patchCount + 1) % SNAPSHOT_INTERVAL === 0) {
      await prisma.version.create({
        data: {
          documentId,
          userId,
          diff: fullContent,
          versionNumber: patchCount + 2,
          isSnapshot: true,
        },
      });

      await prisma.document.update({
        where: { id: documentId },
        data: {
          content: fullContent,
          updatedAt: new Date(),
        },
      });
    }

    res.status(201).json(version);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create version" });
  }
}

export async function updateSnapshot(req, res) {
  const { documentId, fullContent } = req.body;

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: fullContent,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({ message: "Snapshot updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update snapshot" });
  }
}

export async function getDocumentContent(req, res) {
  const documentId = req.params.id;

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { content: true },
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const latestSnapshot = await prisma.version.findFirst({
      where: {
        documentId,
        isSnapshot: true,
      },
      orderBy: { versionNumber: "desc" },
    });

    const minVersionNumber = latestSnapshot?.versionNumber || 0;

    const patches = await prisma.version.findMany({
      where: {
        documentId,
        isSnapshot: false,
        versionNumber: {
          gt: minVersionNumber,
        },
      },
      orderBy: { versionNumber: "asc" },
      select: {
        versionNumber: true,
        diff: true,
        createdAt: true,
        userId: true,
      },
    });

    res.status(200).json({ snapshot: doc.content, patches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load document content" });
  }
}

export async function shareDocument(req, res) {
  try {
    const documentId = req.params.id;
    const { email } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You're not the owner of this document" });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.collaborator.create({
      data: { userId: targetUser.id, documentId },
    });

    res.status(200).json({ message: "Added collaborator" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to share document" });
  }
}

export async function getDocumentCollaborators(req, res) {
  try {
    const documentId = req.params.id;

    const collaborators = await prisma.collaborator.findMany({
      where: { documentId },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            image: true,
          },
        },
      },
    });

    res.status(200).json(collaborators);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get collaborators" });
  }
}

export async function getUserData(req, res) {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user data" });
  }
}

export async function getUserProfiles(req, res) {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        image: true,
      },
    });

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user profiles" });
  }
}

export async function deleteDocument(req, res) {
  const documentId = req.params.id;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this document" });
    }

    await prisma.version.deleteMany({ where: { documentId } });
    await prisma.collaborator.deleteMany({ where: { documentId } });

    await prisma.document.delete({ where: { id: documentId } });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete document" });
  }
}

export async function getVersions(req, res) {
  const documentId = req.params.id;

  try {
    const versions = await prisma.version.findMany({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: {
        versionNumber: true,
        diff: true,
        createdAt: true,
        userId: true,
      },
    });

    res.status(200).json(versions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get versions" });
  }
}

export async function revertVersion(req, res) {
  const documentId = req.params.id;
  const { versionNumber, userId } = req.body;

  try {
    const version = await prisma.version.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    if (!version.diff) {
      return res
        .status(400)
        .json({ message: "Version content (diff) is missing or invalid" });
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.diff,
        updatedAt: new Date(),
      },
    });

    const latestVersion = await prisma.version.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = latestVersion
      ? latestVersion.versionNumber + 1
      : 1;

    await prisma.version.create({
      data: {
        documentId,
        userId,
        diff: version.diff,
        versionNumber: nextVersionNumber,
        isSnapshot: true,
      },
    });

    res.status(200).json({
      message: "Reverted successfully",
      updatedContent: version.diff,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to revert version" });
  }
}

export async function updateDocumentTitle(req, res) {
  const documentId = req.params.id;
  const { title } = req.body;

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { title },
    });

    res.status(200).json({ message: "Document title updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update document title" });
  }
}

export async function getVersionContent(req, res) {
  const { id: documentId, versionNumber } = req.params;
  try {
    const snapshot = await prisma.version.findFirst({
      where: {
        documentId,
        isSnapshot: true,
        versionNumber: { lte: parseInt(versionNumber) },
      },
      orderBy: { versionNumber: "desc" },
    });

    const fromVersion = snapshot ? snapshot.versionNumber : 0;
    const base = snapshot ? snapshot.diff : { ops: [] };

    const patches = await prisma.version.findMany({
      where: {
        documentId,
        isSnapshot: false,
        versionNumber: {
          gt: fromVersion,
          lte: parseInt(versionNumber),
        },
      },
      orderBy: { versionNumber: "asc" },
    });

    let content = new Delta(base);
    for (const patch of patches) {
      content = content.compose(new Delta(patch.diff));
    }

    return res.status(200).json({ content });
  } catch (err) {
    console.error("Failed to fetch version content", err);
    res.status(500).json({ message: "Failed to fetch version content" });
  }
}
