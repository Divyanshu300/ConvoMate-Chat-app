import express from "express";
import {
  adminLogin,
  adminLogout,
  allChats,
  deleteUser,
  allMessages,
  allUsers,
  getAdminData,
  getDashboardStats,
  broadcastMessage,
} from "../controllers/admin.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly, isAuthenticated } from "../middlewares/auth.js";

const app = express.Router();

app.post("/verify/", adminLoginValidator(), validateHandler, adminLogin);

app.get("/logout/", adminLogout);

// Only Admin Can Accecss these Routes

app.use(adminOnly);

app.get("/", getAdminData);

app.get("/users", allUsers);
// app.delete("/users/deleteUser", deleteUser);
app.get("/chats", allChats);
app.get("/messages", allMessages);

app.get("/stats", getDashboardStats);

app.post('/users/broadcast',isAuthenticated, broadcastMessage);

export default app;
