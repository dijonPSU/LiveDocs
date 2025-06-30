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


server.on('upgrade', (request) => {
  onSocketUpgrade(request);
});


const onSocketUpgrade = (req) => {
  const webClientSocketKey = req.headers['sec-websocket-key'];
  console.log(`Received WebSocket connection from ${webClientSocketKey}`);
  const headers = prepareHandShakeResponse(webClientSocketKey);
  console.log({headers});

}

// combining the client's key with the magic string, hashing it, and returning a base64-encoded result.
const prepareHandShakeResponse = (webClientSocketKey) => {
  const hash = crypto.createHash('sha1').update(webClientSocketKey + WEBSOCKET_MAGIC_STRING);
  const response =  hash.digest('base64');
  return response;
}

//error handling to keep server running
[
  "uncaughtException",
  "unhandledRejection",
].forEach((eventType) => {
  process.on(eventType, (error) => {
    console.error(`error caught! event: ${error}, msg: ${error.message || error.stack}`);
    process.exit(1);
  });
});
