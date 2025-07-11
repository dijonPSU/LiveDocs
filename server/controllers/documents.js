import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient();

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
  const { documentId, userId, delta } = req.body;

  try {
    const count = await prisma.version.count({
      where: { documentId },
    });

    const version = await prisma.version.create({
      data: {
        documentId,
        userId,
        diff: delta,
        versionNumber: count + 1,
        isSnapshot: false,
      },
    });

    // TODO: CALL snapshot every 10 patches

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

    const patches = await prisma.version.findMany({
      where: {
        documentId,
        isSnapshot: false,
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
