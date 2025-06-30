import { createServer } from 'http';
import crypto from 'crypto';

const PORT = 8080;
const WEBSOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const server = createServer((request, response) => {
  response.writeHead(200);
  response.end("Test Server");
}).listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('upgrade', onSocketUpgrade);

function onSocketUpgrade(req, socket, head) {
  const webClientSocketKey = req.headers['sec-websocket-key'];
  console.log(`Received WebSocket connection from ${webClientSocketKey}`);
  const headers = prepareHandShakeResponse(webClientSocketKey);
  socket.write(headers);

  // Add event listener for error
  socket.on('error', (error) => {
    console.error(`Error occurred: ${error}`);
  });

  // Add event listener for disconnections
  socket.on('end', () => {
    console.log('Client disconnected');
  });
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

// combining the client's key with the magic string, hashing it, and returning a base64-encoded result.
const createSocketAccept = (webClientSocketKey) => {
  const hash = crypto.createHash('sha1').update(webClientSocketKey + WEBSOCKET_MAGIC_STRING);
  const response = hash.digest('base64');
  return response;
}

//error handling to keep server running
["uncaughtException", "unhandledRejection"]
.forEach((eventType) => {
  process.on(eventType, (error) => {
    console.error(`error caught! event: ${error}, msg: ${error.message || error.stack}`);
    process.exit(1);
  });
});
