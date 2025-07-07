import io from "socket.io-client";

const connectToWebSocket = () => {
  const socket = io("http://localhost:3001");
  return socket;
};

const get = async (URL) => {
  const response = await fetch(URL);
  const data = await response.json();
  return data;
};

const post = async (URL, data) => {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  return responseData;
};

const put = async (URL, data) => {
  const response = await fetch(URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  return responseData;
};

const deleteRequest = async (URL) => {
  const response = await fetch(URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const responseData = await response.json();
  return responseData;
};

const handleSignIn = () => {
  window.location.href = "http://localhost:3000/auth/google";
};

function connectTestToWebsocket() {
  const ws = new WebSocket("ws://localhost:8080");
  return ws;
}

export {
  get,
  post,
  put,
  deleteRequest,
  connectToWebSocket,
  handleSignIn,
  connectTestToWebsocket,
};
