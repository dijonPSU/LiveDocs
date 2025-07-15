import { createServer } from "http";
import crypto from "crypto";

const PORT = 8080;

const rooms = new Map();

// -- websocket constants --
const WEBSOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MASK_KEY_LENGTH = 4;
const OPCODE_TEXT = 0x1;
const FIN_BIT = 0x80;
const MAX_PAYLOAD_LENGTH_7BIT = 125;
const PAYLOAD_LENGTH_16BIT = 126;
const MAX_PAYLOAD_LENGTH_16BIT = 65535;
const PAYLOAD_LENGTH_64BIT = 127;

const messageActionEnum = {
  JOIN: "join",
  LEAVE: "leave",
  SEND: "send",
  CLIENTLIST: "clientList",
  IDENTIFY: "identify",
};

// -- server --
const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("Test Server");
}).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("upgrade", onSocketUpgrade);

// error handling
["uncaughtException", "unhandledRejection"].forEach((eventType) => {
  process.on(eventType, (err) => {
    console.error(`Error caught: ${err.stack || err}`);
  });
});

// -- functions --
function onSocketUpgrade(req, socket) {
  const clientKey = req.headers["sec-websocket-key"];
  if (!clientKey) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  // respond to handshake
  const acceptKey = createAcceptKey(clientKey);
  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "\r\n",
  ].join("\r\n");
  socket.write(responseHeaders);

  // buffer incoming data here
  socket._buffer = Buffer.alloc(0);

  socket.on("data", (data) => {
    socket._buffer = Buffer.concat([socket._buffer, data]);
    processBuffer(socket);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  socket.on("end", () => {
    console.log("Client disconnected");

    if (socket.rooms) {
      socket.rooms.forEach((roomName) => {
        leaveRoom(socket, roomName);
      });
      socket.rooms.clear();
      socket.rooms = null;
    }
  });
}

function createAcceptKey(key) {
  return crypto
    .createHash("sha1")
    .update(key + WEBSOCKET_MAGIC_STRING)
    .digest("base64");
}

// process dataFrame Buffer
function processBuffer(socket) {
  let buffer = socket._buffer;
  console.log("Incoming data");

  while (true) {
    if (buffer.length < 2) return; // need at least 2 bytes to read header

    const firstByte = buffer[0];
    const secondByte = buffer[1];

    const fin = (firstByte & 0x80) !== 0;
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;

    let offset = 2;

    if (payloadLength === PAYLOAD_LENGTH_16BIT) {
      if (buffer.length < offset + 2) return;
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === PAYLOAD_LENGTH_64BIT) {
      socket.destroy();
      console.error("64-bit length not supported right now");
      return;
    }

    const totalLength = offset + (masked ? MASK_KEY_LENGTH : 0) + payloadLength;
    if (buffer.length < totalLength) return; // wait for full data

    let payloadStart = offset;
    let maskingKey;

    if (masked) {
      maskingKey = buffer.slice(offset, offset + MASK_KEY_LENGTH);
      payloadStart += MASK_KEY_LENGTH;
    }

    let payloadData = buffer.slice(payloadStart, payloadStart + payloadLength);

    if (masked) {
      payloadData = unmask(payloadData, maskingKey);
    }

    handleFrame(socket, opcode, payloadData, fin);

    // get rid of processed frame
    buffer = buffer.slice(totalLength);
    socket._buffer = buffer;
  }
}

function unmask(buffer, mask) {
  // XOR the data with the mask key to decode it
  // i % MASK_KEY_LENGTH is to ensure we don't go out of bounds. should only be 0, 1, 2, 3
  const result = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] ^ mask[i % MASK_KEY_LENGTH];
  }
  return result;
}

function handleFrame(socket, opcode, data) {
  const OPCODE_CLOSE = 0x8;
  const OPCODE_PING = 0x9;
  const OPCODE_PONG = 0xa;

  switch (opcode) {
    case OPCODE_CLOSE: // Close frame
      console.log("Client sent close frame");
      socket.end();
      break;

    case OPCODE_PING: // Ping frame
      // Respond with Pong
      sendFrame(socket, 0xa, data);
      break;

    case OPCODE_PONG: // Pong frame
      break;

    case OPCODE_TEXT: {
      const message = data.toString("utf8").trim();

      try {
        const jsonData = JSON.parse(message);
        const { action, userId, roomName, message: msg, reset = false } = jsonData;

        switch (action) {
          case messageActionEnum.IDENTIFY:
            if (userId) {
              socket.id = userId;
            }
            break;
          case messageActionEnum.JOIN:
            joinRoom(socket, roomName);
            break;
          case messageActionEnum.LEAVE:
            leaveRoom(socket, roomName);
            break;
          case messageActionEnum.SEND:
            if (roomName) {
              sendToRoom(
                socket,
                roomName,
                JSON.stringify({
                  action: messageActionEnum.SEND,
                  from: socket.id,
                  roomName,
                  message: msg,
                  reset: reset,
                }),
                false,
              );
            } else {
              console.log("No room specified");
            }
            break;
          default:
            console.error("Invalid action:", action);
            return;
        }
      } catch (err) {
        console.error("JSON processing error:", err);
        console.error("Invalid JSON content:", message);
        const errResp = JSON.stringify({
          error: "Invalid JSON format",
          originalMessage: message,
        });
        sendFrame(socket, OPCODE_TEXT, Buffer.from(errResp));
      }
      break;
    }
    default:
      console.warn(`Unsupported opcode: ${opcode}`);
      break;
  }
}

// send dataframes
function sendFrame(socket, opcode, payload) {
  const payloadLength = payload.length;
  let header;

  const finAndOpcode = FIN_BIT | opcode;

  if (payloadLength <= MAX_PAYLOAD_LENGTH_7BIT) {
    header = Buffer.alloc(2);
    header[0] = finAndOpcode;
    header[1] = payloadLength;
  } else if (payloadLength <= MAX_PAYLOAD_LENGTH_16BIT) {
    header = Buffer.alloc(4);
    header[0] = finAndOpcode;
    header[1] = PAYLOAD_LENGTH_16BIT;
    header.writeUInt16BE(payloadLength, 2);
  } else {
    // may add larger message support later
    console.error("Message too large to send");
    return;
  }

  const frame = Buffer.concat([header, payload]);
  socket.write(frame);
}

function joinRoom(client, roomName) {
  // create room if it doesn't exist
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }

  // add client to room set
  rooms.get(roomName).add(client);

  if (!client.rooms) {
    client.rooms = new Set();
  }

  const clientsInRoom = Array.from(rooms.get(roomName)).map((c) => c.id);

  const clientListMessage = {
    action: messageActionEnum.CLIENTLIST,
    roomName,
    clients: clientsInRoom,
  };

  sendToRoom(client, roomName, JSON.stringify(clientListMessage), true);

  client.rooms.add(roomName);
  console.log(`Socket ${client.id} joined room ${roomName}`);
}

function leaveRoom(client, roomName) {
  if (rooms.has(roomName)) {
    rooms.get(roomName).delete(client);
    if (rooms.get(roomName).size === 0) {
      rooms.delete(roomName);
    } else {
      const updatedClients = Array.from(rooms.get(roomName)).map((c) => c.id);
      const clientListMessage = {
        action: messageActionEnum.CLIENTLIST,
        roomName,
        clients: updatedClients,
      };
      sendToRoom(client, roomName, JSON.stringify(clientListMessage), true);
    }
  }

  if (client.rooms) {
    client.rooms.delete(roomName);
  }
}

function sendToRoom(roomClient, roomName, message, includeSender = false) {
  if (rooms.has(roomName)) {
    const roomToBroadcast = rooms.get(roomName);
    roomToBroadcast.forEach((client) => {
      if (includeSender || client !== roomClient) {
        sendFrame(client, OPCODE_TEXT, Buffer.from(message));
      }
    });
  } else {
    console.error(`Room ${roomName} does not exist`);
    sendFrame(
      roomClient,
      OPCODE_TEXT,
      Buffer.from(`Room ${roomName} does not exist`),
    );
  }
}
