import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { cookieOptions } from "../utils/features.js";
import { adminSecretKey } from "../app.js";
import { Request } from "../models/request.js";
import { Server , Socket } from "socket.io";
import { corsOptions } from "../constants/config.js";
import http from "http";
import express from "express"

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

// Add this listener for socket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Example of emitting an event when a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});



const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  const isMatched = secretKey === adminSecretKey;

  if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));

  const token = jwt.sign(secretKey, process.env.JWT_SECRET);

  return res
    .status(200)
    .cookie("convomate-admin-token", token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15,
    })
    .json({
      success: true,
      message: "Authenticated Successfully, Welcome BOSS",
    });
});

const adminLogout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("convomate-admin-token", "", {
      ...cookieOptions,
      maxAge: 0,
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

const getAdminData = TryCatch(async (req, res, next) => {
  return res.status(200).json({
    admin: true,
  });
});

const allUsers = TryCatch(async (req, res) => {
  const users = await User.find({});

  const transformedUsers = await Promise.all(
    users.map(async ({ name, username, avatar, _id }) => {
      const [groups, friends] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);

      return {
        name,
        username,
        avatar: avatar.url,
        _id,
        groups,
        friends,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    users: transformedUsers,
  });
});


const deleteUser = TryCatch(async (req, res , next) => {

  
  const { userId } = req.body;

  // console.log(userId);

  

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
});

const allChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")
    .populate("creator", "name avatar");

  const transformedChats = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });

      return {
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    chats: transformedChats,
  });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

    
    // console.log("inside all messages: ",messages);
    // for(let i=0;i<messages;i++){
    //   console.log("message id: ",i._id);
    // }
   
  // try{
  //   const transformedMessages = messages.map(
  //     ({ content, attachments, _id, sender, createdAt, chat }) => ({
  //       _id,
  //       attachments,
  //       content,
  //       createdAt,
  //       chat: chat._id,
  //       groupChat: chat.groupChat,
  //       sender: {
  //         _id: sender._id,
  //         name: sender.name,
  //         avatar: sender.avatar.url,
  //       },
  //     })
  //   );
  //   return res.status(200).json({
  //     success: true,
  //     messages: transformedMessages,
  //   });
  // }
  // catch(error){
  //   console.log("error ",error);
  // }

  try {
    const transformedMessages = messages.map((message) => {
      const { content, attachments, _id, sender, createdAt, chat } = message;
  
      // Add checks to ensure chat and sender are not null or undefined
      if (!chat || !sender) {
        console.error("Message with missing chat or sender:", message);
        // Skip this message or handle it as per your requirement
        return null;
      }
  
      // Proceed with the transformation if checks pass
      return {
        _id,
        attachments,
        content,
        createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: {
          _id: sender._id,
          name: sender.name,
          avatar: sender.avatar.url,
        },
      };
    }).filter(Boolean); // Remove null values from the array
  
    return res.status(200).json({
      success: true,
      messages: transformedMessages,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
  
});

const getDashboardStats = TryCatch(async (req, res) => {
  const [groupsCount, usersCount, messagesCount, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMiliseconds = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    messagesChart: messages,
  };

  return res.status(200).json({
    success: true,
    stats,
  });
});

const broadcastMessage = async (req, res) => {
  
  console.log("hiii")

  const { message, userId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Fetch all users
    const users = await User.find();

    for (let user of users) {
      // Find or create a chat for each user
      let chat = await Chat.findOne({ members: { $all: [user._id, userId] } });

      if (!chat) {
        chat = new Chat({
          name:` ${user.username} - Admin Chat`,
          groupChat: false,
          creator: userId,
          members: [user._id, userId],
        });

        await chat.save();
      }

      // Create a new message for each user
      const newMessage = new Message({
        sender: userId,
        content: message,
        chat: chat._id,
        createdAt: new Date(),
      });

      await newMessage.save();
    }

    res.status(200).json({ success: 'Message broadcasted to all users' });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ error: 'An error occurred while broadcasting the message' });
  }
};

export {
  allUsers,
  deleteUser,
  allChats,
  allMessages,
  getDashboardStats,
  adminLogin,
  adminLogout,
  getAdminData,
  broadcastMessage,
};
