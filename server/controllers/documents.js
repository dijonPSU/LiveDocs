import { PrismaClient } from "../generated/prisma/client.js";
import { sendEmail } from "./emailService.js";
import {
  getUserGroupIds,
  getHighestRole,
} from "./helper-functions/documentHelpers.js";
import Delta from "quill-delta";

const prisma = new PrismaClient();
const SNAPSHOT_INTERVAL = 20;

/**
 * Retrieves all documents accessible to the authenticated user
 * @param {string} req.user.id - User ID
 * @returns {Promise<void>} JSON array of documents ordered by updatedAt desc
 * @description Gets documents where user is owner, has direct permissions, or belongs to groups with permissions
 */
export async function getDocuments(req, res) {
  try {
    const groupIds = await getUserGroupIds(req.user.id);

    const orClause = [
      { ownerId: req.user.id },
      { permissions: { some: { userId: req.user.id } } },
      ...(groupIds.length
        ? [{ permissions: { some: { groupId: { in: groupIds } } } }]
        : []),
    ];

    const documents = await prisma.document.findMany({
      where: { OR: orClause },
      orderBy: { updatedAt: "desc" },
    });

    res.json(documents);
  } catch (err) {
    console.error(`[getDocuments]`, err);
    res.status(500).json({ message: "Failed to get documents" });
  }
}

/**
 * Creates a new document for the authenticated user
 * @param {string} req.body.title - Document title
 * @param {Object} [req.body.content={}] - Initial document content (Delta format)
 * @param {string} req.user.id - User ID
 * @returns {Promise<void>} JSON object of created document with 201 status
 * @description Creates a new document with the user as owner
 */
export async function createDocument(req, res) {
  const { title, content = {} } = req.body;

  try {
    const document = await prisma.document.create({
      data: { title, content, ownerId: req.user.id },
    });
    res.status(201).json(document);
  } catch (err) {
    console.error(`[createDocument]`, err);
    res.status(500).json({ message: "Failed to create document" });
  }
}

/**
 * Saves a patch (delta) to the document version history
 * @param {string} req.body.userId - ID of user making the change
 * @param {Object} req.body.delta - Delta object representing the change
 * @param {Object} req.body.fullContent - Complete document content after change
 * @param {string} req.params.id - Document ID
 * @returns {Promise<void>} JSON object of created version with 201 status
 * @description Creates a new version entry and optionally creates snapshots at intervals
 */
export async function savePatch(req, res) {
  const { userId, delta, fullContent } = req.body;
  const documentId = req.params.id;

  if (!delta || !fullContent) {
    return res
      .status(400)
      .json({ message: "Delta and full content are required" });
  }

  try {
    // Get the latest version number to ensure uniqueness
    const latestVersion = await prisma.version.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = latestVersion
      ? latestVersion.versionNumber + 1
      : 1;

    // Count patches for snapshot interval calculation
    const patchCount = await prisma.version.count({
      where: { documentId, isSnapshot: false },
    });

    const version = await prisma.version.create({
      data: {
        documentId,
        userId,
        diff: delta,
        versionNumber: nextVersionNumber,
        isSnapshot: false,
      },
    });

    // Take a snapshot every N patches for efficiency
    if ((patchCount + 1) % SNAPSHOT_INTERVAL === 0) {
      await prisma.version.create({
        data: {
          documentId,
          userId,
          diff: fullContent,
          versionNumber: nextVersionNumber + 1,
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
    console.error(`[savePatch]`, err);
    res.status(500).json({ message: "Failed to create version" });
  }
}

/**
 * Updates the document snapshot with full content
 * @param {string} req.body.documentId - Document ID
 * @param {Object} req.body.fullContent - Complete document content (Delta format)
 * @returns {Promise<void>} Success message with 200 status
 * @description Updates the main document content and timestamp
 */
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
    console.error(`[updateSnapshot]`, err);
    res.status(500).json({ message: "Failed to update snapshot" });
  }
}

/**
 * Retrieves document content including snapshot and patches
 * @param {string} req.params.id - Document ID
 * @returns {Promise<void>} JSON object with snapshot and patches array
 * @description Gets the latest snapshot and all patches since that snapshot for document reconstruction
 */
export async function getDocumentContent(req, res) {
  const documentId = req.params.id;
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { content: true, title: true },
    });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    const latestSnapshot = await prisma.version.findFirst({
      where: { documentId, isSnapshot: true },
      orderBy: { versionNumber: "desc" },
    });
    const minVersionNumber = latestSnapshot?.versionNumber || 0;

    const patches = await prisma.version.findMany({
      where: {
        documentId,
        isSnapshot: false,
        versionNumber: { gt: minVersionNumber },
      },
      orderBy: { versionNumber: "asc" },
      select: {
        versionNumber: true,
        diff: true,
        createdAt: true,
        userId: true,
      },
    });

    res.status(200).json({ snapshot: doc.content, patches, title: doc.title });
  } catch (err) {
    console.error(`[getDocumentContent]`, err);
    res.status(500).json({ message: "Failed to load document content" });
  }
}

/**
 * Shares a document with another user by email
 * @param {string} req.params.id - Document ID
 * @param {string} req.body.email - Email of user to share with
 * @param {string} [req.body.role="EDITOR"] - Role to assign (EDITOR, VIEWER, ADMIN) - defaults to EDITOR
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.id - User ID
 * @param {string} req.user.email - User email
 * @returns {Promise<void>} JSON object with sharing details and 200 status
 * @description Allows document owner to share document with other users and sends email notification
 */
export async function shareDocument(req, res) {
  try {
    const documentId = req.params.id;
    const { email, role = "EDITOR" } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document || document.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You're not the owner of this document" });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate
    const [alreadyCollaborator, alreadyPermission] = await Promise.all([
      prisma.collaborator.findUnique({
        where: { userId_documentId: { userId: targetUser.id, documentId } },
      }),
      prisma.documentPermission.findFirst({
        where: { documentId, userId: targetUser.id, groupId: null },
      }),
    ]);
    if (alreadyCollaborator || alreadyPermission) {
      return res
        .status(400)
        .json({ message: "User is already a collaborator or has permission" });
    }

    await prisma.documentPermission.create({
      data: {
        documentId,
        userId: targetUser.id,
        groupId: null,
        role,
        grantedBy: req.user.id,
      },
    });

    // Send email notification
    await sendEmail({
      to: email,
      fromUser: req.user.email,
      docTitle: document.title,
    });

    res.status(200).json({
      message: "Added collaborator",
      userId: targetUser.id,
      email: targetUser.email,
      documentTitle: document.title,
      sharedBy: req.user.email,
    });
  } catch (err) {
    console.error(`[shareDocument]`, err);
    res.status(500).json({ message: "Failed to share document" });
  }
}

/**
 * Retrieves all collaborators for a specific document
 * @param {string} req.params.id - Document ID
 * @returns {Promise<void>} JSON array of collaborators with user info and roles
 * @description Gets all users who have direct permissions (not group-based) for the document
 */
export async function getDocumentCollaborators(req, res) {
  try {
    const documentId = req.params.id;
    const permissions = await prisma.documentPermission.findMany({
      where: {
        documentId,
        userId: { not: null },
        groupId: null,
      },
      include: {
        user: {
          select: { id: true, email: true, image: true },
        },
      },
    });
    const collaborators = permissions
      .filter((p) => p.user)
      .map((p) => ({
        user: p.user,
        role: p.role,
      }));
    res.status(200).json(collaborators);
  } catch (err) {
    console.error(`[getDocumentCollaborators]`, err);
    res.status(500).json({ message: "Failed to get collaborators" });
  }
}

/**
 * Retrieves user data by user ID
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - User ID
 * @returns {Promise<void>} JSON object with user data (id, email, image)
 * @description Gets basic user information for a specific user ID
 */
export async function getUserData(req, res) {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, image: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error(`[getUserData]`, err);
    res.status(500).json({ message: "Failed to get user data" });
  }
}

/**
 * Retrieves user profiles for multiple user IDs
 * @param {string[]} req.body.userIds - Array of user IDs to fetch
 * @returns {Promise<void>} JSON array of user profiles (id, email, image)
 * @description Gets basic user information for multiple users by their IDs
 */
export async function getUserProfiles(req, res) {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds array is required" });
    }
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, image: true },
    });
    res.status(200).json(users);
  } catch (err) {
    console.error(`[getUserProfiles]`, err);
    res.status(500).json({ message: "Failed to get user profiles" });
  }
}

/**
 * Deletes a document and all associated data
 * @param {string} req.params.id - Document ID
 * @param {string} req.user.id - User ID
 * @returns {Promise<void>} Success message with 200 status
 * @description Only document owner can delete. Removes all versions, collaborators, permissions, groups, and share links
 */
export async function deleteDocument(req, res) {
  const documentId = req.params.id;
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document)
      return res.status(404).json({ message: "Document not found" });
    if (document.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this document" });
    }

    // Use transaction for atomic delete
    await prisma.$transaction([
      prisma.version.deleteMany({ where: { documentId } }),
      prisma.collaborator.deleteMany({ where: { documentId } }),
      prisma.documentPermission.deleteMany({ where: { documentId } }),
      prisma.userGroup.deleteMany({ where: { documentId } }),
      prisma.shareLink.deleteMany({ where: { documentId } }),
      prisma.document.delete({ where: { id: documentId } }),
    ]);

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(`[deleteDocument]`, err);
    res.status(500).json({ message: "Failed to delete document" });
  }
}

/**
 * Retrieves all versions for a specific document
 * @param {string} req.params.id - Document ID
 * @returns {Promise<void>} JSON array of versions ordered by versionNumber desc
 * @description Gets all document versions with version number, diff, creation date, and user ID
 */
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
    console.error(`[getVersions]`, err);
    res.status(500).json({ message: "Failed to get versions" });
  }
}

/**
 * Reverts a document to a specific version
 * @param {string} req.params.id - Document ID
 * @param {number} req.body.versionNumber - Version number to revert to
 * @param {string} req.body.userId - ID of user performing the revert
 * @returns {Promise<void>} JSON object with success message and updated content
 * @description Reconstructs content up to target version and creates new snapshot
 */
export async function revertVersion(req, res) {
  const documentId = req.params.id;
  const { versionNumber, userId } = req.body;
  try {
    const targetVersion = await prisma.version.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });
    if (!targetVersion)
      return res.status(404).json({ message: "Version not found" });

    // Reconstruct content up to target version
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
        versionNumber: { gt: fromVersion, lte: parseInt(versionNumber) },
      },
      orderBy: { versionNumber: "asc" },
    });

    let reconstructedContent = new Delta(base);
    for (const patch of patches) {
      reconstructedContent = reconstructedContent.compose(
        new Delta(patch.diff),
      );
    }

    // Update document and create new snapshot version
    const latestVersion = await prisma.version.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const nextVersionNumber = latestVersion
      ? latestVersion.versionNumber + 1
      : 1;

    await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: {
          content: reconstructedContent,
          updatedAt: new Date(),
        },
      }),
      prisma.version.create({
        data: {
          documentId,
          userId,
          diff: reconstructedContent,
          versionNumber: nextVersionNumber,
          isSnapshot: true,
        },
      }),
    ]);

    res.status(200).json({
      message: "Reverted successfully",
      updatedContent: reconstructedContent,
    });
  } catch (err) {
    console.error(`[revertVersion]`, err);
    res.status(500).json({ message: "Failed to revert version" });
  }
}

/**
 * Updates the title of a document
 * @param {string} req.params.id - Document ID
 * @param {string} req.body.title - New document title
 * @returns {Promise<void>} Success message with 200 status
 * @description Updates the document title in the database
 */
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
    console.error(`[updateDocumentTitle]`, err);
    res.status(500).json({ message: "Failed to update document title" });
  }
}

/**
 * Retrieves the reconstructed content for a specific document version
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Document ID
 * @param {string} req.params.versionNumber - Version number to reconstruct
 * @returns {Promise<void>} JSON object with reconstructed content
 * @description Reconstructs document content up to specified version by composing snapshots and patches
 */
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
        versionNumber: { gt: fromVersion, lte: parseInt(versionNumber) },
      },
      orderBy: { versionNumber: "asc" },
    });

    let content = new Delta(base);
    for (const patch of patches) {
      content = content.compose(new Delta(patch.diff));
    }

    res.status(200).json({ content });
  } catch (err) {
    console.error(`[getVersionContent]`, err);
    res.status(500).json({ message: "Failed to fetch version content" });
  }
}

/**
 * Updates or creates a collaborator's role for a document
 * @param {string} req.params.documentId - Document ID
 * @param {string} req.params.userId - User ID to update role for
 * @param {string} req.body.role - New role to assign (EDITOR, VIEWER, ADMIN)
 * @param {string} req.user.id - User ID of person making the change
 * @returns {Promise<void>} JSON object with success message and permission data
 * @description Creates new permission if none exists, otherwise updates existing permission
 */
export async function updateCollaboratorRole(req, res) {
  const { documentId, userId } = req.params;
  const { role } = req.body;

  if (!documentId || !userId || !role) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const permission = await prisma.documentPermission.findFirst({
      where: { documentId, userId, groupId: null },
    });

    if (!permission) {
      const created = await prisma.documentPermission.create({
        data: {
          documentId,
          userId,
          groupId: null,
          role,
          grantedBy: req.user.id,
        },
      });
      return res.status(201).json({
        message: "Permission created successfully",
        permission: created,
      });
    }

    const updated = await prisma.documentPermission.update({
      where: { id: permission.id },
      data: { role },
    });

    return res.status(200).json({
      message: "Permission updated successfully",
      permission: updated,
    });
  } catch (err) {
    console.error(`[updateCollaboratorRole]`, err);
    return res.status(500).json({ message: "Failed to update permission" });
  }
}

/**
 * Retrieves the user's role for a specific document
 * @param {string} req.params.id - Document ID
 * @param {string} req.user.id - User ID
 * @returns {Promise<void>} JSON object with user's role for the document
 * @description Determines user's highest role (ADMIN if owner, otherwise highest from direct/group permissions)
 */
export async function getUserRole(req, res) {
  const documentId = req.params.id;
  const userId = req.user.id;
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { ownerId: true },
    });

    if (document && document.ownerId === userId) {
      return res.status(200).json({ role: "ADMIN" });
    }

    const groupIds = await getUserGroupIds(userId);
    const permissions = await prisma.documentPermission.findMany({
      where: {
        documentId,
        OR: [
          { userId },
          ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
        ],
      },
    });

    const role = getHighestRole(permissions);
    if (!role) return res.status(404).json({ message: "Permission not found" });

    return res.status(200).json({ role });
  } catch (err) {
    console.error(`[getUserRole]`, err);
    return res.status(500).json({ message: "Failed to get user role" });
  }
}
