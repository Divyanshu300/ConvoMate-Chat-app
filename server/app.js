
import express from "express";
import { connectDB } from "./utils/features.js";
import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuid } from "uuid";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import {
  // REFETCH_CHATS,
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
  // message reaction
  MESSAGE_REACTION,
} from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import { corsOptions } from "./constants/config.js";
import { isAuthenticated, socketAuthenticator } from "./middlewares/auth.js";

import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";

dotenv.config({
  path: "./.env",
});


// import { Chat } from "../models/chat.js";
// import { User } from "../models/user.js";
// import { Request } from "../models/request.js";

import { Chat } from "./models/chat.js";
import { User } from "./models/user.js";
import { Request } from "./models/request.js";


const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 4000;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "tanya";
const userSocketIDs = new Map();
const onlineUsers = new Set();

connectDB(mongoURI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});


app.set("io", io);



// Using Middlewares Here

app.use(express.json());
app.use(cookieParser());
// corsOptions
app.use(cors(corsOptions));

app.delete("/api/v1/admin/users/deleteUser" ,isAuthenticated, async(req,res)=>{
  console.log("here.....")
  const { userId } = req.body;

  console.log(userId);

  

  // Find and remove chats where the user is the creator
  const createdChats = await Chat.find({ creator: userId });
  for (const chat of createdChats) {
    await Chat.deleteOne({ _id: chat._id });
  }

  // Find chats where the user is a member
  const memberChats = await Chat.find({ members: userId });
  for (const chat of memberChats) {
    if (!chat.groupChat) {
      // If it's not a group chat, delete the entire chat
      await Chat.deleteOne({ _id: chat._id });
    } else {
      // If it is a group chat, remove the user from the members list
      chat.members.pull(userId);
      await chat.save();
    }
  }

  // Optionally, delete chats that have no members left (to clean up orphaned chats)
  const emptyChats = await Chat.find({ members: { $size: 0 } });
  for (const chat of emptyChats) {
    await Chat.deleteOne({ _id: chat._id });
  }

  // Find and remove messages sent by the user
  const userMessages = await Message.find({ sender: userId });
  for (const message of userMessages) {
    await Message.deleteOne({ _id: message._id });
  }

  // Remove the user's reactions from all messages
  const reactedMessages = await Message.find({ 'reactions.userId': userId });
  for (const message of reactedMessages) {
    message.reactions = message.reactions.filter(reaction => reaction.userId.toString() !== userId);
    await message.save();
  }

  // Find and remove requests where the user is the sender or receiver
  const requests = await Request.find({
    $or: [{ sender: userId }, { receiver: userId }]
  });
  for (const request of requests) {
    await Request.deleteOne({ _id: request._id });
  }


  // Delete the user
  await User.findByIdAndDelete(userId);

  io.emit("userUpdate" )

  return res.status(200).json({
    success : true ,
    message : "user deleted successfully"
  })
})


app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("Hello World");
});



io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
  const user = socket.user;
  userSocketIDs.set(user._id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

    try {
      await Message.create(messageForDB);
    } catch (error) {
      throw new Error(error);
    }
  });

  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });



  
  // Handling emoji reactions to messages
  socket.on(MESSAGE_REACTION, async ({ chatId, messageId, reaction, userId }) => {
    const message = await Message.findById(messageId);

    if (message) {
      message.reactions.push({ userId, reaction });
      await message.save();

      const membersSocket = getSockets(message.chat.members);
      io.to(membersSocket).emit(MESSAGE_REACTION, {
        chatId,
        messageId,
        reaction,
        userId,
      });
      
    }
  });


  socket.on("disconnect", () => {
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server is running on port ${port} in ${envMode} Mode`);
});

export { envMode, adminSecretKey, userSocketIDs };
