import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient();

export async function isDocumentAdminOrOwner(userId, documentId) {
  // Check if user is document owner
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true }
  });
  if (!doc) return false;
  if (doc.ownerId === userId) return true;

  // Find all groups this user is a member of for this document
  const userGroups = await prisma.userGroup.findMany({
    where: {
      documentId,
      members: {
        some: { id: userId }
      }
    },
    select: { id: true },
  });
  const groupIds = userGroups.map((g) => g.id);

  // Check both direct user permissions and group permissions
  const adminPermission = await prisma.documentPermission.findFirst({
    where: {
      documentId,
      role: "ADMIN",
      OR: [
        { userId, groupId: null },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds }, userId: null }] : [])
      ],
    },
  });

  return !!adminPermission;
}
