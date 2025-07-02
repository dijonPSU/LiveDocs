import { createServer } from "http";
import crypto from "crypto";

const PORT = 8080;

// Websocket constants
const WEBSOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MASK_KEY_LENGTH = 4;
const OPCODE_TEXT = 0x1;
const FIN_BIT = 0x80;

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("Test Server");
}).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("upgrade", onSocketUpgrade);

["uncaughtException", "unhandledRejection"].forEach((eventType) => {
  process.on(eventType, (err) => {
    console.error(`Error caught: ${err.stack || err}`);
  });
});

// handshake
function onSocketUpgrade(req, socket, head) {
  const clientKey = req.headers["sec-websocket-key"];
  if (!clientKey) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

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
  });
}

function createAcceptKey(key) {
  return crypto
    .createHash("sha1")
    .update(key + WEBSOCKET_MAGIC_STRING)
    .digest("base64");
}

// dataframe processing
function processBuffer(socket) {
  let buffer = socket._buffer;

  while (true) {
    if (buffer.length < 2) return; // need at least 2 bytes to read header

    const firstByte = buffer[0];
    const secondByte = buffer[1];

    const fin = (firstByte & 0x80) !== 0;
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;

    let offset = 2;

    if (payloadLength === 126) {
      if (buffer.length < offset + 2) return;
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
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

function handleFrame(socket, opcode, data, fin) {
  if (opcode === 0x8) {
    console.log("Client sent close frame");
    socket.end();
    return;
  }

  if (opcode === 0x9) {
    // ping frame, respond with pong
    sendFrame(socket, 0xa, data);
    return;
  }

  if (opcode === 0xa) {
    // pong frame, do nothing
    return;
  }

  if (opcode === OPCODE_TEXT) {
    const message = data.toString("utf8").trim();
    if (message.startsWith("{") && message.endsWith("}")) {
      try {
        const jsonData = JSON.parse(message);
        console.log("Received JSON:", jsonData);
        const response = JSON.stringify({ message: jsonData });
        sendFrame(socket, OPCODE_TEXT, Buffer.from(response));
      } catch {
        console.error("Invalid JSON:", message);
        const errResp = JSON.stringify({
          error: "Invalid JSON format",
          originalMessage: message,
        });
        sendFrame(socket, OPCODE_TEXT, Buffer.from(errResp));
      }
    } else {
      console.log("Received text message:", message);
      const response = JSON.stringify({ type: "text", message });
      sendFrame(socket, OPCODE_TEXT, Buffer.from(response));
    }
  } else {
    console.warn(`Unsupported opcode: ${opcode}`);
  }
}

// sending frames
function sendFrame(socket, opcode, payload) {
  const payloadLength = payload.length;
  let header;

  const finAndOpcode = FIN_BIT | opcode;

  if (payloadLength <= 125) {
    header = Buffer.alloc(2);
    header[0] = finAndOpcode;
    header[1] = payloadLength;
  } else if (payloadLength <= 65535) {
    header = Buffer.alloc(4);
    header[0] = finAndOpcode;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
  } else {
    // may add larger message support later
    console.error("Message too large to send");
    return;
  }

  const frame = Buffer.concat([header, payload]);
  socket.write(frame);
  console.log("Sent message:", payload.toString());
}
