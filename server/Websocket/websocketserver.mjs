import { createServer } from 'http';
import crypto from 'crypto';

const PORT = 8080;



const WEBSOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MAX_7_BITS_INT_MARKER  = 125;
const MAX_16_BITS_INT_MARKER = 126;
const MAX_64_BITS_INT_MARKER = 127;
const MASK_KEY_LENGTH = 4;
const FIRST_BIT = 128;

const server = createServer((request, response) => {
  response.writeHead(200);
  response.end("Test Server");
}).listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('upgrade', onSocketUpgrade);


//error handling to keep server running
["uncaughtException", "unhandledRejection"]
.forEach((eventType) => {
  process.on(eventType, (error) => {
    console.error(`error caught! event: ${error}, msg: ${error.message || error.stack}`);
    process.exit(1);
  });
});


function onSocketUpgrade(req, socket, head) {
  const webClientSocketKey = req.headers['sec-websocket-key'];
  console.log(`Received WebSocket connection from ${webClientSocketKey}`);
  const headers = prepareHandShakeResponse(webClientSocketKey);
  socket.write(headers);
  socket.on('readable', () => readSocketData(socket));

  // Add event listener for error
  socket.on('error', (error) => {
    console.error(`Error occurred: ${error}`);
  });

  // Add event listener for disconnections
  socket.on('end', () => {
    console.log('Client disconnected');
  });
}

// combining the client's key with the magic string, hashing it, and returning a base64-encoded result.
function createSocketAccept(webClientSocketKey){
  const hash = crypto.createHash('sha1').update(webClientSocketKey + WEBSOCKET_MAGIC_STRING);
  const response = hash.digest('base64');
  return response;
}

function prepareHandShakeResponse(webClientSocketKey) {
  const accept = createSocketAccept(webClientSocketKey);
  const headers = {
    'HTTP/1.1 101 Switching Protocols': null,
    'Upgrade': 'websocket',
    'Connection': 'Upgrade',
    'Sec-WebSocket-Accept': accept
  };
  // convert headers to string because socket.write() expects a string
  const headerString = Object.keys(headers).map(key => `${key}: ${headers[key]}`).join('\r\n') + '\r\n\r\n';
  return headerString;
}


function readSocketData(socket) {
  // consume optcode (first byte)
  socket.read(1);

  const [payloadLength] = socket.read(1);

  // first bit is always 1, so we can ignore it (1 bit = 128)
  const LengthIndicator = payloadLength - FIRST_BIT;

  let messageLength = 0;

  if(LengthIndicator <= MAX_7_BITS_INT_MARKER){
    messageLength = LengthIndicator;
  } else {
    console.error("Message length not supported right now");
  }

  const maskKey = socket.read(MASK_KEY_LENGTH);
  const encodedMessage = socket.read(messageLength);
  const decoded = unMask(encodedMessage, maskKey).toString('utf-8');
  const data = JSON.parse(decoded);

  console.log(`recieved message: ${data.message}`);
}


function unMask(encodedBuffer, maskKey) {
  const unmaskedData = Buffer.from(encodedBuffer); // create a copy of the buffer

  // XOR the data with the mask key to decode it
  // i & MASK_KEY_LENGTH is to ensure we don't go out of bounds. should only be 0, 1, 2, 3
  for (let i = 0; i < encodedBuffer.length; i++) {
    unmaskedData[i] = encodedBuffer[i] ^ maskKey[i % MASK_KEY_LENGTH];
  }
  return unmaskedData;
}
