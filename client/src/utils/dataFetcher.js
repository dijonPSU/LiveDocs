import { httpMethod, baseURL, httpHeaders } from "./constants";

const getUserData = async (id = null) => {
  const URL = id ? `${baseURL}/users/${id}` : `${baseURL}/me`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user data");

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Cannot get user data", error.message);
    return null;
  }
};

const getUserDocuments = async () => {
  const URL = `${baseURL}/documents`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user documents");

    const documents = await response.json();
    return documents;
  } catch (error) {
    console.error("Cannot get user documents", error.message);
    return null;
  }
};

const createDocument = async (title) => {
  const URL = `${baseURL}/documents`;
  const data = {
    title: title,
  };

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create document");
    return await response.json();
  } catch (error) {
    console.error("Cannot create document", error.message);
    return null;
  }
};

const getDocumentContent = async (documentId) => {
  const URL = `${baseURL}/documents/${documentId}/content`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch document content");
    const content = await response.json();
    return content;
  } catch (error) {
    console.error("Cannot get document content", error.message);
    return null;
  }
};

const savePatch = async (documentId, delta, userId, quillRef) => {
  const URL = `${baseURL}/documents/${documentId}/patches`;

  const body = {
    userId,
    delta,
    fullContent: quillRef.current.getContents(),
  };

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to save patch");

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Cannot save patch", error.message);
    return null;
  }
};

const shareDocument = async (documentId, email, role) => {
  const URL = `${baseURL}/documents/${documentId}/share`;

  const body = {
    documentId: documentId,
    email,
    role,
  };

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to share document");
    return await response.json();
  } catch (error) {
    console.error("Cannot share document", error.message);
    return null;
  }
};

const getCollaborators = async (documentId) => {
  const URL = `${baseURL}/documents/${documentId}/collaborators`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch collaborators");

    const collaborators = await response.json();
    return collaborators;
  } catch (error) {
    console.error("Cannot get collaborators", error.message);
    return null;
  }
};

const deleteDocument = async (documentId) => {
  const URL = `${baseURL}/documents/${documentId}`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.DELETE,
      credentials: "include",
    });

    if (response.status === 403) {
      throw new Error("You are not the owner");
    }

    if (!response.ok) throw new Error("Failed to delete document");

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Cannot delete document", error.message);
    return null;
  }
};

const getCollaboratorsProfiles = async (clientIds) => {
  if (!clientIds || clientIds.length === 0) {
    return [];
  }

  const URL = `${baseURL}/users/profiles`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ userIds: clientIds }),
    });

    if (!response.ok) throw new Error("Failed to fetch collaborator profiles");

    const profiles = await response.json();
    return profiles;
  } catch (error) {
    console.error("Cannot get collaborator profiles", error.message);
    return [];
  }
};

const getVersions = async (documentId) => {
  const URL = `${baseURL}/documents/${documentId}/versions`;

  try {
    const response = await fetch(URL, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch versions");
    const versions = await response.json();
    return versions;
  } catch (error) {
    console.error("Cannot get versions", error.message);
    throw error;
  }
};

const revertToVersion = async (documentId, versionNumber, userId) => {
  const URL = `${baseURL}/documents/${documentId}/revert`;

  const body = { versionNumber, userId };

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to revert version");
    return await response.json();
  } catch (error) {
    console.error("Cannot revert version", error.message);
    throw error;
  }
};

const updateDocumentTitle = async (documentId, title) => {
  const URL = `${baseURL}/documents/${documentId}`;
  const body = { title };

  try {
    const response = await fetch(URL, {
      method: httpMethod.PATCH,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to update document title");
    return await response.json();
  } catch (error) {
    console.error("Cannot update document title", error.message);
    throw error;
  }
};

const getVersionContent = async (documentId, versionNumber) => {
  const URL = `${baseURL}/documents/${documentId}/versions/${versionNumber}`;
  try {
    const response = await fetch(URL, {
      method: httpMethod.GET,
      credentials: "include",
      headers: httpHeaders,
    });
    if (!response.ok) throw new Error("Failed to get version content");
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Cannot fetch version content", error.message);
    throw error;
  }
};

const updateCollaboratorRole = async (documentId, userId, newRole) => {
  const URL = `${baseURL}/documents/${documentId}/collaborators/${userId}`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.PATCH,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) throw new Error("Failed to update collaborator role");
    return response.json();
  } catch (error) {
    console.error("Cannot update collaborator role", error.message);
    throw error;
  }
};

const getUserRole = async (documentId) => {
  const URL = `${baseURL}/documents/${documentId}/userRole`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user role");

    const userRole = await response.json();
    return userRole;
  } catch (error) {
    console.error("Cannot get user role", error.message);
    throw error;
  }
};

const getUserGroups = async (documentId) => {
  const URL = `${baseURL}/groups?documentId=${documentId}`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch groups");

    return await response.json();
  } catch (error) {
    console.error("Cannot get groups", error.message);
    throw error;
  }
};

const getAllUserGroups = async () => {
  const URL = `${baseURL}/groups/all`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch all groups");

    return await response.json();
  } catch (error) {
    console.error("Cannot get all groups", error.message);
    throw error;
  }
};

const createGroup = async (groupName, defaultRole, documentId) => {
  const URL = `${baseURL}/groups`;

  try {
    const respond = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ name: groupName, defaultRole, documentId }),
    });
    if (!respond.ok) throw new Error("Failed to create group");

    return await respond.json();
  } catch (error) {
    console.error("Cannot create group", error.message);
    throw error;
  }
};

const addGroupMember = async (groupId, email) => {
  const URL = `${baseURL}/groups/${groupId}/members`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error("Failed to add group member");

    return await response.json();
  } catch (error) {
    console.error("Cannot add group member", error.message);
    throw error;
  }
};

const removeGroupMember = async (groupId, userId) => {
  const URL = `${baseURL}/groups/${groupId}/members/${userId}`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.DELETE,
      credentials: "include",
      headers: httpHeaders,
    });
    if (!response.ok) throw new Error("Failed to remove group member");

    return await response.json();
  } catch (error) {
    console.error("Cannot remove group member", error.message);
    throw error;
  }
};

const deleteGroup = async (groupId) => {
  const URL = `${baseURL}/groups/${groupId}`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.DELETE,
      credentials: "include",
      headers: httpHeaders,
    });
    if (!response.ok) throw new Error("Failed to delete group");

    return true;
  } catch (error) {
    console.error("Cannot delete group", error.message);
    throw error;
  }
};

const addGroupDocumentPermission = async (documentId, groupId, role) => {
  const URL = `${baseURL}/documents/${documentId}/permissions/group`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ groupId, role }),
    });
    if (!response.ok) throw new Error("Failed to add group permission");

    return await response.json();
  } catch (error) {
    console.error("Cannot add group permission", error.message);
    throw error;
  }
};

const getGroupById = async (groupId) => {
  const URL = `${baseURL}/groups/${groupId}`;
  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch group");
    return await response.json();
  } catch (error) {
    console.error("Cannot get group", error.message);
    return null;
  }
};

const summarizeDocument = async (docId, text) => {
  const URL = `${baseURL}/documents/${docId}/summarize`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Failed to summarize document");
    return await response.json();
  } catch (error) {
    console.error("Cannot summarize document", error.message);
    return null;
  }
};

const getRankedSuggestions = async (context, suggestions) => {
  const URL = `${baseURL}/rank`;

  try {
    const response = await fetch(URL, {
      method: httpMethod.POST,
      credentials: "include",
      headers: httpHeaders,
      body: JSON.stringify({ context, suggestions }),
    });

    if (!response.ok) throw new Error("Failed to rank suggestions");

    const rankedSuggestions = await response.json();

    // If ranking service returns empty array use the original suggestions
    if (!rankedSuggestions || rankedSuggestions.length === 0) {
      return suggestions.slice(0, 3);
    }

    // return the top 3 suggestions
    return rankedSuggestions.slice(0, 3);
  } catch (error) {
    console.error("Cannot rank suggestions", error.message);
    // go with the original suggestions if ranking fails
    return suggestions.slice(0, 3);
  }
};

export {
  getUserData,
  getUserDocuments,
  createDocument,
  getDocumentContent,
  savePatch,
  shareDocument,
  getCollaborators,
  deleteDocument,
  getCollaboratorsProfiles,
  getVersions,
  revertToVersion,
  updateDocumentTitle,
  getVersionContent,
  updateCollaboratorRole,
  getUserRole,
  getUserGroups,
  getAllUserGroups,
  createGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  addGroupDocumentPermission,
  getGroupById,
  summarizeDocument,
  getRankedSuggestions,
};
