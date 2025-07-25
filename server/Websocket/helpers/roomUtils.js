import { messageActionEnum, OPCODE_TEXT } from "../constants.js";
import { sendFrame } from "./frameUtils.js";

/**
 * Adds a socket to a room and notifies all clients of updated client list
 */
export function joinRoom(rooms, client, roomName, sendToRoom) {
  if (!rooms.has(roomName)) rooms.set(roomName, new Set());
  rooms.get(roomName).add(client);

  if (!client.rooms) client.rooms = new Set();
  client.rooms.add(roomName);

  const clientsInRoom = Array.from(rooms.get(roomName)).map((c) => c.id);
  const clientListMessage = {
    action: messageActionEnum.CLIENTLIST,
    roomName,
    clients: clientsInRoom,
  };

  sendToRoom(client, roomName, JSON.stringify(clientListMessage), true);
}

/**
 * Removes a socket from a room and notifies others of the updated client list
 */
export function leaveRoom(rooms, client, roomName, sendToRoom) {
  if (!rooms.has(roomName)) return;

  rooms.get(roomName).delete(client);
  client.rooms?.delete(roomName);

  if (rooms.get(roomName).size === 0) {
    rooms.delete(roomName);
  } else {
    const clients = Array.from(rooms.get(roomName)).map((c) => c.id);
    const clientListMessage = {
      action: messageActionEnum.CLIENTLIST,
      roomName,
      clients,
    };
    sendToRoom(client, roomName, JSON.stringify(clientListMessage), true);
  }
}

/**
 * Broadcasts a message to all clients in a room
 */
export function sendToRoom(
  rooms,
  roomClient,
  roomName,
  message,
  includeSender = false,
) {
  if (!rooms.has(roomName)) {
    sendFrame(
      roomClient,
      OPCODE_TEXT,
      Buffer.from(`Room ${roomName} does not exist`),
    );
    return;
  }

  rooms.get(roomName).forEach((client) => {
    if (includeSender || client !== roomClient) {
      sendFrame(client, OPCODE_TEXT, Buffer.from(message));
    }
  });
}

/**
 * Sends a message to all sockets belonging to a user ID
 */
export function sendToUser(userSockets, userId, messageObj) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  const msgStr = JSON.stringify(messageObj);
  sockets.forEach((socket) => {
    sendFrame(socket, OPCODE_TEXT, Buffer.from(msgStr));
  });
}
