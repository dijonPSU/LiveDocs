import { createServer } from 'http';
import crypto from 'crypto';

const PORT = 8080;



const WEBSOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MAX_7_BITS_INT_MARKER  = 125;
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


  // test data
  const testData = JSON.parse('{"message": "Hello from the server!"}');

  socket.on('readable', () => readSocketData(socket));
  const msg = JSON.stringify({
    message: testData.message
  });
  sendSocketData(socket, msg);

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
  // Read first byte (opcode + FIN)
  const firstByteBuffer = socket.read(1);
  if (!firstByteBuffer) return; // <-- socket is closed or no data

  const secondByteBuffer = socket.read(1);
  if (!secondByteBuffer) return;

  const [payloadLength] = secondByteBuffer;
  const lengthIndicator = payloadLength - FIRST_BIT;

  let messageLength = 0;
  if (lengthIndicator <= MAX_7_BITS_INT_MARKER) {
    messageLength = lengthIndicator;
  } else {
    console.error("Message length not supported");
    return;
  }

  const maskKey = socket.read(MASK_KEY_LENGTH);
  if (!maskKey) return;

  const encodedMessage = socket.read(messageLength);
  if (!encodedMessage) return;

  const decoded = unMask(encodedMessage, maskKey).toString('utf-8').trim();

  // to handle JSON or raw text
  if (decoded.startsWith('{') && decoded.endsWith('}')) {
    try {
      const data = JSON.parse(decoded);
      console.log(`Received JSON message:`, data);
      const response = JSON.stringify({
        message: data
      });

      sendSocketData(socket, response);
    } catch (e) {
      console.error(`Invalid JSON format: ${decoded}`);
    }
  } else {
    console.log(`Received plain text message: "${decoded}"`);
  }

}


function unMask(encodedBuffer, maskKey) {
  const unmaskedData = Buffer.from(encodedBuffer); // create a copy of the buffer

  // XOR the data with the mask key to decode it
  // i % MASK_KEY_LENGTH is to ensure we don't go out of bounds. should only be 0, 1, 2, 3
  for (let i = 0; i < encodedBuffer.length; i++) {
    unmaskedData[i] = encodedBuffer[i] ^ maskKey[i % MASK_KEY_LENGTH];
  }
  return unmaskedData;
}


function sendSocketData(socket, data) {
  const sendData = prepareMessageToSend(data);
  socket.write(sendData);
  console.log(`sent message: ${data}`);

}


function prepareMessageToSend(data) {
  const encoded = Buffer.from(data);
  const dataSize = data.length;


  let dataFrameBuffer;
  let offset = 2;

  // 0x80 = 128 == 1 byte
  // first byte needs to contain the FIN and the opcode
  const firstByte = 0x80 | 0x01; // FIN = 1, opcode = 1 (text)
  if (dataSize <= MAX_7_BITS_INT_MARKER) {
    const bytes = [firstByte];
    dataFrameBuffer = Buffer.from(bytes.concat(dataSize));
  }else{
    throw new Error("message length not supported");
  }

  const length = dataFrameBuffer.byteLength + dataSize;
  const dataFrame = concat([dataFrameBuffer, encoded], length);
  return dataFrame;
}


function concat(bufferList, totalLength) {
  const target = Buffer.alloc(totalLength);
  let offset = 0;

  for (const buffer of bufferList) {
    target.set(buffer, offset);
    offset += buffer.length;
  }

  return target;
}
