import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient();

export async function getDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      where: { ownerId: req.user.id },
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
  const { documentId } = req.params;

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
