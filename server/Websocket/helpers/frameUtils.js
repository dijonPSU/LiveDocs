import crypto from "crypto";
import {
  FIN_BIT,
  MASK_KEY_LENGTH,
  MAX_PAYLOAD_LENGTH_7BIT,
  MAX_PAYLOAD_LENGTH_16BIT,
  PAYLOAD_LENGTH_16BIT,
} from "../constants.js";

/**
 * Generates the Sec-WebSocket-Accept value for handshake
 * @param {string} key - The key value from the handshake request
 * @param {string} MAGIC_STRING - The magic string generated by RDC455 to return accept key
 */
export function createAcceptKey(key, MAGIC_STRING) {
  return crypto
    .createHash("sha1")
    .update(key + MAGIC_STRING)
    .digest("base64");
}

/**
 * Unmasks a payload buffer using the masking key (XOR decoding)
 */
export function unmask(buffer, mask) {
  const result = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] ^ mask[i % MASK_KEY_LENGTH];
  }
  return result;
}

/**
 * Constructs and sends a WebSocket frame to the client
 */
export function sendFrame(socket, opcode, payload) {
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
    console.error("Message too large to send");
    return;
  }

  const frame = Buffer.concat([header, payload]);
  socket.write(frame);
}
