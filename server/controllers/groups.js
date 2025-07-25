import { PrismaClient } from "../generated/prisma/client.js";
import { isDocumentAdminOrOwner } from "./helper-functions/groupHelpers.js";
const prisma = new PrismaClient();

/**
 * Creates a new group for a document
 * @param {string} req.body.name - Group name
 * @param {string} req.body.defaultRole - Default role for group members (EDITOR, VIEWER, ADMIN)
 * @param {string} req.body.documentId - Document ID the group belongs to
 * @param {string} req.user.id - User ID (becomes group owner)
 * @returns {Promise<void>} JSON object with created group and 201 status
 * @description Creates a new group with the authenticated user as owner and initial member
 */
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

/**
 * Adds a member to an existing group
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.groupId - Group ID to add member to
 * @param {string} req.body.email - Email of user to add to group
 * @param {string} req.user.id - User ID (must be group owner)
 * @returns {Promise<void>} Success message with 200 status
 * @description Only group owner can add members. Creates document permission if needed.
 */
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

/**
 * Removes a member from an existing group
 * @param {string} req.params.groupId - Group ID to remove member from
 * @param {string} req.params.userId - User ID to remove from group
 * @param {string} req.user.id - User ID (must be group owner)
 * @returns {Promise<void>} Success message with 200 status
 * @description Only group owner can remove members from the group
 */
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

/**
 * Deletes an existing group
 * @param {string} req.params.groupId - Group ID to delete
 * @param {string} req.user.id - User ID (must be group owner)
 * @returns {Promise<void>} 204 status on successful deletion
 * @description Only group owner can delete the group.
 */
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

/**
 * Adds or updates group permissions for a document
 * @param {string} req.params.docId - Document ID to grant group access to
 * @param {string} req.body.groupId - Group ID to grant permissions to
 * @param {string} req.body.role - Role to assign to the group (EDITOR, VIEWER, ADMIN)
 * @param {string} req.user.id - User ID
 * @returns {Promise<void>} JSON object with permission data and 201 status
 * @description Only document admin/owner can grant group permissions. Updates existing or creates new permission.
 */
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

/**
 * Lists all groups that a user belongs to for a specific document
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.documentId - Document ID to filter groups by
 * @param {string} req.user.id - User IDt
 * @returns {Promise<void>} JSON array of groups with member details
 * @description Gets all groups for a specific document where the user is a member
 */
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

/**
 * Lists all groups that a user belongs to across all documents
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.id - User ID
 * @returns {Promise<void>} JSON array of all groups with member and document details
 * @description Gets all groups where the user is a member, ordered by creation date desc
 */
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

/**
 * Retrieves a specific group by its ID
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.groupId - Group ID to retrieve
 * @returns {Promise<void>} JSON object with group details including members and owner
 * @description Gets detailed information about a specific group including all members and owner data
 */
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
