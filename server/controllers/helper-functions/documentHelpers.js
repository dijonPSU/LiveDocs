import { PrismaClient } from "../../generated/prisma/client.js";
const prisma = new PrismaClient();

/**
 * Get all group IDs that the user is a member of.
 * @param {string} userId
 * @returns {Promise<string[]>}
 */

export async function getUserGroupIds(userId) {
  const userGroups = await prisma.userGroup.findMany({
    where: { members: { some: { id: userId } } },
    select: { id: true },
  });
  return userGroups.map((g) => g.id);
}

/**
 * Return the highest-priority role from a list of permissions.
 * @param {Array<{role: string}>} permissions
 * @returns {string|null}
 */

export function getHighestRole(permissions) {
  const rolePriority = { ADMIN: 3, EDITOR: 2, VIEWER: 1 };
  let highest = null;
  for (const perm of permissions) {
    if (!highest || rolePriority[perm.role] > rolePriority[highest.role]) {
      highest = perm;
    }
  }
  return highest ? highest.role : null;
}
