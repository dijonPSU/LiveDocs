import { create } from 'domain';
import { createServer } from 'http';
const PORT = 8080;


const server = createServer((request, response) => {
  response.writeHead(200);
  response.end("Test Server");
}).listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


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
