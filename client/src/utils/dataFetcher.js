const httpMethod = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PATCH: "PATCH",
};

const httpHeaders = {
  "Content-Type": "application/json",
};

const baseURL = "http://localhost:3000";

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
    console.log("Document created successfully");
    return await response.json();
  } catch (error) {
    console.log("error");
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
    console.log("Document content fetched successfully");
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

const shareDocument = async (documentId, email) => {
  const URL = `${baseURL}/documents/${documentId}/share`;

  const body = {
    documentId: documentId,
    email,
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
};
