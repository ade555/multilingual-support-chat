import http from "http";
import express from "express";
import cors from "cors";
import { LingoDotDevEngine } from "lingo.dev/sdk";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { loadConversations } from "./utils/conversationManager.js";
import { setAgentLanguage } from "./utils/conversationManager.js";
import conversationsRoutes from "./routes/conversations.js";

dotenv.config();

const lingoDotDev = new LingoDotDevEngine({
  apiKey: process.env.LINGODOTDEV_API_KEY, // use your actual API key from lingo.dev
});

const app = express(); // initialize express
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN, methods: ["GET", "POST"] })); // CORS
app.use(express.json());

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  // websocket configuration
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

app.use(
  "/api",
  conversationsRoutes({
    io,
    lingoDotDev,
  }),
);

// Websocket events
io.on("connection", (socket) => {
  // Handle join events for customers and agents
  socket.on("customer_join", (customerId) => {
    console.log("[WebSocket] Customer joined:", socket.id, customerId);
    socket.join(`customer-${customerId}`);
  });
  socket.on("agent_join", ({ language }) => {
    console.log("[WebSocket] Agent joined:", socket.id, "Language:", language);
    socket.join("agents");
    if (language) {
      // new
      setAgentLanguage(language); // new
    }
  });

  socket.on("disconnect", () => {
    console.log("[WebSocket] Client disconnected:", socket.id);
  });
});

await loadConversations();

server.listen(PORT, () => {
  console.log("server is active");
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
