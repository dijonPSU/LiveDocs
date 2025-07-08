const connectTestToWebsocket = () => {
  const ws = new WebSocket("ws://localhost:8080");
  return ws;
};

const getUserData = async () => {
  const URL = "http://localhost:3000/me";
  try {
    const response = await fetch(URL, {
      method: "GET",
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

export { connectTestToWebsocket, getUserData };
