const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("send-changes", (delta) => {
    console.log("Received changes:", delta);
    // Broadcast the changes to all other clients
    socket.broadcast.emit("receive-changes", delta);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
