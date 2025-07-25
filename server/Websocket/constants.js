// Protocol constants
export const WEBSOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
export const MASK_KEY_LENGTH = 4;
export const OPCODE_TEXT = 0x1;
export const FIN_BIT = 0x80;
export const MAX_PAYLOAD_LENGTH_7BIT = 125;
export const PAYLOAD_LENGTH_16BIT = 126;
export const MAX_PAYLOAD_LENGTH_16BIT = 65535;
export const PAYLOAD_LENGTH_64BIT = 127;

// Enum for message actions used by clients
export const messageActionEnum = {
  JOIN: "join",
  LEAVE: "leave",
  SEND: "send",
  CLIENTLIST: "clientList",
  IDENTIFY: "identify",
  NOTIFICATION: "notification",
  CURSOR: "cursor",
};
