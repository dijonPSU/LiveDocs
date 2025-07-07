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
  console.log("handleSignIn");
  const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

  const params = {
    client_id:
      "210179651380-g1s8fdb4enh5rifte5qnbra1dbuef6ht.apps.googleusercontent.com",
    redirect_uri: "http://localhost:5173/callback",
    response_type: "token",
    scope:
      "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/calendar.readonly",
    include_granted_scopes: "true",
    state: "pass-through value",
  };

  const url = new URL(oauth2Endpoint);
  Object.keys(params).forEach((key) => {
    url.searchParams.append(key, params[key]);
  });

  // redirect user to the Google OAuth2.0 authorization page
  window.location.href = url.toString();
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
