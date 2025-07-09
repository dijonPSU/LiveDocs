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



