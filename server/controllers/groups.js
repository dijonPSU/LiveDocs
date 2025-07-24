import { PrismaClient } from "../generated/prisma/client.js";
import { isDocumentAdminOrOwner } from "./groupHelper.js";
const prisma = new PrismaClient();

// Create a group
export async function createGroup(req, res) {
  const { name, defaultRole, documentId } = req.body;
  const ownerId = req.user.id;

  if (!name || !defaultRole || !documentId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const group = await prisma.userGroup.create({
      data: {
        name,
        defaultRole,
        document: { connect: { id: documentId } },
        owner: { connect: { id: ownerId } },
        members: { connect: { id: ownerId } },
      },
      include: { members: true },
    });

    res.status(201).json({ group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create group" });
  }
}

// Add member to group
export async function addGroupMember(req, res) {
  const { groupId } = req.params;
  const { email } = req.body;

  // Check if group exists
  const group = await prisma.userGroup.findUnique({
    where: { id: groupId },
    include: { document: true },
  });
  if (!group) return res.status(404).json({ message: "Group not found" });

  // Check permissions
  if (group.ownerId !== req.user.id)
    return res.status(403).json({ message: "Only owner can add" });

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  try {
    // Add user to group
    await prisma.userGroup.update({
      where: { id: groupId },
      data: { members: { connect: { id: user.id } } },
    });

    // Create group permission for the document if it doesn't exist
    const existingGroupPermission = await prisma.documentPermission.findFirst({
      where: {
        documentId: group.documentId,
        groupId: groupId,
        userId: null,
      },
    });

    if (!existingGroupPermission) {
      await prisma.documentPermission.create({
        data: {
          documentId: group.documentId,
          groupId: groupId,
          userId: null,
          role: group.defaultRole,
          grantedBy: req.user.id,
        },
      });
    }

    res.status(200).json({ message: "Group member added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add group member" });
  }
}

// Remove member from group
export async function removeGroupMember(req, res) {
  const { groupId, userId } = req.params;
  const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (group.ownerId !== req.user.id)
    return res.status(403).json({ message: "Only owner can remove" });
  try {
    await prisma.userGroup.update({
      where: { id: groupId },
      data: { members: { disconnect: { id: userId } } },
    });
    res.status(200).json({ message: "Group member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove group member" });
  }
}

// Delete group
export async function deleteGroup(req, res) {
  const { groupId } = req.params;
  const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (group.ownerId !== req.user.id)
    return res.status(403).json({ message: "Only owner can delete" });
  try {
    await prisma.userGroup.delete({ where: { id: groupId } });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete group" });
  }
}

// Share doc with group
export async function addGroupPermission(req, res) {
  const { docId } = req.params;
  const { groupId, role } = req.body;
  const userId = req.user.id;

  // Doc admin/owner check
  if (!(await isDocumentAdminOrOwner(userId, docId))) {
    return res.status(403).json({
      message: "Only doc admin/owner can edit group permissions for this doc",
    });
  }

  try {
    // Check if permission already exists for this group and document
    const existingPermission = await prisma.documentPermission.findFirst({
      where: {
        documentId: docId,
        groupId: groupId,
        userId: null,
      },
    });

    let perm;
    if (existingPermission) {
      // Update existing permission
      perm = await prisma.documentPermission.update({
        where: { id: existingPermission.id },
        data: { role },
      });
    } else {
      // Create new permission
      perm = await prisma.documentPermission.create({
        data: {
          documentId: docId,
          groupId,
          userId: null,
          role,
          grantedBy: userId,
        },
      });
    }

    res.status(201).json({ perm });
  } catch (error) {
    console.error("Error adding group permission:", error);
    res.status(500).json({ message: "Failed to add group permission" });
  }
}

// List groups user belongs to for a specific document
export async function listGroups(req, res) {
  const userId = req.user.id;
  const { documentId } = req.query;

  if (!documentId) {
    return res.status(400).json({ message: "documentId is required" });
  }

  try {
    const groups = await prisma.userGroup.findMany({
      where: {
        documentId: documentId,
        members: { some: { id: userId } },
      },
      include: {
        members: { select: { id: true, email: true, image: true } },
      },
    });
    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to list groups" });
  }
}

// List all groups user belongs to (across all documents)
export async function listAllGroups(req, res) {
  const userId = req.user.id;

  try {
    const groups = await prisma.userGroup.findMany({
      where: {
        members: { some: { id: userId } },
      },
      include: {
        members: { select: { id: true, email: true, image: true } },
        document: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to list all groups" });
  }
}

export async function getGroupById(req, res) {
  const { groupId } = req.params;
  try {
    const group = await prisma.userGroup.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        owner: true,
        GroupMembership: { include: { user: true } },
      },
    });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch group" });
  }
}
