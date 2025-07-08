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

export { connectTestToWebsocket, getUserData, getUserDocuments };
