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
