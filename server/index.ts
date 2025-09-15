// server/index.ts
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";


const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket: Socket) => {
  console.log("✅ A user connected:", socket.id);


  
  // Set nickname
  socket.on("set-nickname", (nickname: string) => {
    socket.data.nickname = nickname;
  });

  // Join a room
  socket.on("join-room", (roomName: string) => {
    const name = socket.data.nickname || "Anonymous";

    socket.join(roomName); // 👈 join the given room
    console.log(`👤 ${name} joined room: ${roomName}`);

    io.to(roomName).emit("user-joined", `✨ ${name} joined room: ${roomName}`);
  });

  // Chat only in the current room
  socket.on("chat-message", ({ room, message }) => {
    const name = socket.data.nickname || "Anonymous";
    console.log(`💬 [${room}] ${name}: ${message}`);

    io.to(room).emit("chat-message", `${name}: ${message}`);
  });

  socket.on("change-video", ({ room, videoId }) => {
  console.log(`🎥 Changing video in room ${room} to ${videoId}`);
  io.to(room).emit("change-video", videoId); // broadcast to everyone
});

socket.on("video action", ({ room, action }) => {
  socket.to(room).emit("video action", action);
});

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

app.get("/", (_req, res) => {
  res.send("🎬 WatchParty server is running!");
});


httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
