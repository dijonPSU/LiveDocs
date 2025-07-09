const connectTestToWebsocket = () => {
  const ws = new WebSocket("ws://localhost:8080");
  return ws;
};

const getUserData = async () => {
  const URL = "http://localhost:3000/me";
  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Not authenticated");

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Cannot get user data", error.message);
    return null;
  }
};

const getUserDocuments = async () => {
  const URL = "http://localhost:3000/documents";

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Not authenticated");

    const documents = await response.json();
    return documents;
  } catch (error) {
    console.error("Cannot get user documents", error.message);
    return null;
  }
};

const createDocument = async (title) => {
  const URL = "http://localhost:3000/documents";
  const data = {
    title: title,
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Not authenticated");
    console.log("Document created successfully");
  } catch (error) {
    console.log("error");
    console.error("Cannot create document", error.message);
    return null;
  }
};

const getDocumentContent = async (documentId) => {
  const URL = `http://localhost:3000/documents/${documentId}/content`;

  try {
    const response = await fetch(URL, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Not authenticated");
    const content = await response.json();
    console.log("Document content fetched successfully");
    return content;
  } catch (error) {
    console.error("Cannot get document content", error.message);
    return null;
  }
};

const savePatch = async (documentId, delta, userId) => {
  const URL = `http://localhost:3000/documents/${documentId}/patches`;;

  const body = {
    documentId: documentId,
    delta,
    userId,
  }

  try {
    const response = await fetch(URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Not authenticated");
  } catch (error) {
    console.error("Cannot save patch", error.message);
    return null;
  }
};

export {
  connectTestToWebsocket,
  getUserData,
  getUserDocuments,
  createDocument,
  getDocumentContent,
  savePatch,
};
