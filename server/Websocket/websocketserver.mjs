import { createServer } from "http";
import {
  WEBSOCKET_MAGIC_STRING,
  PAYLOAD_LENGTH_16BIT,
  PAYLOAD_LENGTH_64BIT,
  MASK_KEY_LENGTH,
  OPCODE_TEXT,
  messageActionEnum,
} from "./constants.js";
import { createAcceptKey, unmask, sendFrame } from "./helpers/frameUtils.js";
import {
  joinRoom,
  leaveRoom,
  sendToRoom,
  sendToUser,
} from "./helpers/roomUtils.js";

export default class WebSocketServer {
  constructor(port) {
    this.rooms = new Map(); // Map of room names to sets of connected sockets
    this.userSockets = new Map(); // Map of user IDs to sets of their socket connections

    // Create HTTP server that upgrades to WebSocket
    this.server = createServer((_req, res) => {
      res.writeHead(200);
      res.end("WebSocket Server");
    }).listen(port, () => {
      console.log(`WebSocket server running on port ${port}`);
    });

    this.server.on("upgrade", this.onSocketUpgrade.bind(this));
  }

  // Handles HTTP upgrade to WebSocket protocol
  onSocketUpgrade(req, socket) {
    const clientKey = req.headers["sec-websocket-key"];
    if (!clientKey) return socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");

    const acceptKey = createAcceptKey(clientKey, WEBSOCKET_MAGIC_STRING);
    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptKey}`,
        "\r\n",
      ].join("\r\n"),
    );

    socket._buffer = Buffer.alloc(0);
    socket.rooms = new Set();

    socket.on("data", (data) => {
      socket._buffer = Buffer.concat([socket._buffer, data]);
      this.processBuffer(socket);
    });

    socket.on("end", () => this.cleanup(socket));
    socket.on("error", (err) => console.error("[Socket error]", err));
  }

  /**
   * Cleanup function when a socket disconnects

   */
  cleanup(socket) {
    // Remove socket from all rooms and notify other room members
    socket.rooms?.forEach((room) =>
      leaveRoom(this.rooms, socket, room, this.sendToRoom.bind(this)),
    );

    if (socket.id && this.userSockets.has(socket.id)) {
      const conns = this.userSockets.get(socket.id);
      conns.delete(socket);
      // Remove user entry if no more connections exist
      if (conns.size === 0) this.userSockets.delete(socket.id);
    }
  }

  /**
   * Parses and processes buffered WebSocket frames
   * @param {net.Socket} socket -  Socket containing buffered frame data
   */
  processBuffer(socket) {
    let buffer = socket._buffer;
    while (buffer.length >= 2) {
      // Parse frame header
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const opcode = firstByte & 0x0f;
      const masked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      // Handle extended payload lengths
      if (payloadLength === PAYLOAD_LENGTH_16BIT) {
        // 16-bit extended length
        if (buffer.length < offset + 2) break;
        payloadLength = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === PAYLOAD_LENGTH_64BIT){
        socket.destroy();
        console.error("64-bit length not supported");
        return;
      }



      const totalLength =
        offset + (masked ? MASK_KEY_LENGTH : 0) + payloadLength;
      if (buffer.length < totalLength) break; // Wait for complete frame

      // Extract masking key if present
      const maskingKey = masked
        ? buffer.slice(offset, offset + MASK_KEY_LENGTH)
        : null;
      offset += masked ? MASK_KEY_LENGTH : 0;

      // Extract and unmask payload
      let payload = buffer.slice(offset, offset + payloadLength);
      if (masked) payload = unmask(payload, maskingKey);

      // Process the complete frame
      this.handleFrame(socket, opcode, payload.toString("utf8").trim());

      // Remove processed frame from buffer
      buffer = buffer.slice(totalLength);
    }

    // Update socket buffer with remaining data
    socket._buffer = buffer;
  }

  handleFrame(socket, opcode, message) {
    // Only process text frames
    if (opcode !== OPCODE_TEXT) return;

    try {
      const json = JSON.parse(message);
      const { action, userId, roomName, message: msg, reset = false } = json;

      switch (action) {
        case messageActionEnum.IDENTIFY:
          if (userId) {
            socket.id = userId;
            if (!this.userSockets.has(userId))
              this.userSockets.set(userId, new Set());
            this.userSockets.get(userId).add(socket);
          }
          break;

        case messageActionEnum.JOIN:
          // Add socket to room
          joinRoom(this.rooms, socket, roomName, this.sendToRoom.bind(this));
          break;

        case messageActionEnum.LEAVE:
          // Remove socket from room
          leaveRoom(this.rooms, socket, roomName, this.sendToRoom.bind(this));
          break;

        case messageActionEnum.SEND:
          // Broadcast message to room members
          if (roomName) {
            sendToRoom(
              this.rooms,
              socket,
              roomName,
              JSON.stringify({
                action: messageActionEnum.SEND,
                from: socket.id,
                roomName,
                message: msg,
                reset,
              }),
            );
          }
          break;

        case messageActionEnum.NOTIFICATION:
          // Send direct notification to specific user
          sendToUser(this.userSockets, json.userId, {
            action: messageActionEnum.NOTIFICATION,
            message: json.message,
            documentId: json.documentId,
          });
          break;

        case messageActionEnum.CURSOR:
          // Share cursor position
          if (roomName && userId && json.range) {
            sendToRoom(
              this.rooms,
              socket,
              roomName,
              JSON.stringify({
                action: messageActionEnum.CURSOR,
                userId,
                range: json.range,
                userInfo: json.userInfo || {},
              }),
            );
          }
          break;
      }
    } catch {
      // Send error response for invalid JSON
      sendFrame(
        socket,
        OPCODE_TEXT,
        Buffer.from(
          JSON.stringify({
            error: "Invalid JSON",
            originalMessage: message,
          }),
        ),
      );
    }
  }

  /**
   * Sends a message to all members of a specific room
   * @param {net.Socket} sender - The socket that is sending the message
   * @param {string} roomName - The name of the room to send the message to
   * @param {string} message - The message content to broadcast (should be JSON string)
   * @param {boolean} [includeSender=false] - Whether to include the sender in the broadcast
   */
  sendToRoom(sender, roomName, message, includeSender = false) {
    sendToRoom(this.rooms, sender, roomName, message, includeSender);
  }
}
