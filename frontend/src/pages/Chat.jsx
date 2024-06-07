
import { useInfiniteScrollTop } from "6pp";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { AttachFile as AttachFileIcon, Send as SendIcon } from "@mui/icons-material";
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { IconButton, Skeleton, Stack } from "@mui/material";
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import FileMenu from "../components/dialogs/FileMenu";
import AppLayout from "../components/layout/AppLayout";
import { TypingLoader } from "../components/layout/Loaders";
import MessageComponent from "../components/shared/MessageComponent";
import { InputBox } from "../components/styles/StyledComponents";
import { bgBlue } from "../constants/color";
import {
  ALERT, CHAT_JOINED, CHAT_LEAVED,
  MESSAGE_REACTION,
  NEW_MESSAGE, START_TYPING, STOP_TYPING,
} from "../constants/events";
import { useErrors, useSocketEvents } from "../hooks/hook";
import { useChatDetailsQuery, useGetMessagesQuery } from "../redux/api/api";
import { removeNewMessagesAlert } from "../redux/reducers/chat";
import { setIsFileMenu } from "../redux/reducers/misc";
import { getSocket } from "../socket";

const Chat = ({ chatId, user }) => {
  const socket = getSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [IamTyping, setIamTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const typingTimeout = useRef(null);

  const chatDetails = useChatDetailsQuery({ chatId, skip: !chatId });
  const oldMessagesChunk = useGetMessagesQuery({ chatId, page });

  const { data: oldMessages, setData: setOldMessages } = useInfiniteScrollTop(
    containerRef,
    oldMessagesChunk.data?.totalPages,
    page,
    setPage,
    oldMessagesChunk.data?.messages
  );

  const errors = [
    { isError: chatDetails.isError, error: chatDetails.error },
    { isError: oldMessagesChunk.isError, error: oldMessagesChunk.error },
  ];


  const members = chatDetails?.data?.chat?.members;

  const messageOnChange = (e) => {
    const value = e.native ? message + e.native : e.target.value;
    setMessage(value);

    if (!IamTyping) {
      socket.emit(START_TYPING, { members, chatId });
      setIamTyping(true);
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit(STOP_TYPING, { members, chatId });
      setIamTyping(false);
    }, [2000]);
  };

  const handleFileOpen = (e) => {
    dispatch(setIsFileMenu(true));
    setFileMenuAnchor(e.currentTarget);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit(NEW_MESSAGE, { chatId, members, message });
    setMessage("");
  };

  useEffect(() => {
    socket.emit(CHAT_JOINED, { userId: user._id, members });
    dispatch(removeNewMessagesAlert(chatId));

    return () => {
      setMessages([]);
      setMessage("");
      setOldMessages([]);
      setPage(1);
      socket.emit(CHAT_LEAVED, { userId: user._id, members });
    };
  }, [chatId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatDetails.isError) return navigate("/");
  }, [chatDetails.isError]);

  const newMessagesListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setMessages((prev) => [...prev, data.message]);
    },
    [chatId]
  );

  const startTypingListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setUserTyping(true);
    },
    [chatId]
  );

  const stopTypingListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setUserTyping(false);
    },
    [chatId]
  );

  const alertListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      const messageForAlert = {
        content: data.message,
        sender: {
          _id: "djasdhajksdhasdsadasdas",
          name: "Admin",
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, messageForAlert]);
    },
    [chatId]
  );

  const reactionListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, reactions: [...msg.reactions, data.reaction] }
            : msg
        )
      );
    },
    [chatId]
  );

  const messageEditedListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data.messageId ? { ...msg, content: data.content, edited: true } : msg
        )
      );
    },
    [chatId]
  );

  const eventHandler = {
    [ALERT]: alertListener,
    [NEW_MESSAGE]: newMessagesListener,
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
    [MESSAGE_REACTION]: reactionListener,
    "MESSAGE_EDITED": messageEditedListener,
  };

  useSocketEvents(socket, eventHandler);
  useErrors(errors);

  const allMessages = [...oldMessages, ...messages];

  const handleEmojiReaction = (emoji, messageId) => {
    socket.emit(MESSAGE_REACTION, { chatId, messageId, reaction: emoji.native });
    setPickerVisible(false);
    setSelectedMessageId(null);
  };

  const toggleEmojiPicker = (messageId) => {
    setSelectedMessageId(messageId);
    setPickerVisible(!isPickerVisible);
  };

  return chatDetails.isLoading ? (
    <Skeleton />
  ) : (
    <Fragment>
      <Stack
       className="chatPic"
        ref={containerRef}
        boxSizing={"border-box"}
        padding={"1rem"}
        spacing={"1rem"}
        // bgcolor={grayColor}
        height={"90%"}
        sx={{
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {allMessages.map((msg) => (
          <MessageComponent
            key={msg._id}
            message={msg}
            user={user}
            toggleEmojiPicker={toggleEmojiPicker}
          />
        ))}
        {userTyping && <TypingLoader />}
        <div ref={bottomRef} />
      </Stack>

      <form
        style={{
          height: "10%",
        }}
        onSubmit={submitHandler}
      >
        <Stack
          direction={"row"}
          height={"100%"}
          padding={"1rem"}
          alignItems={"center"}
          position={"relative"}
        >
          <IconButton
            sx={{
              position: "absolute",
              left: "1rem",
              rotate: "30deg",
            }}
            onClick={handleFileOpen}
          >
            <AttachFileIcon />
          </IconButton>

          <IconButton
            sx={{
              position: "absolute",
              left: "2.5rem",
            }}
            onClick={() => setPickerVisible((prev)=>!prev)}
          >
            <EmojiEmotionsIcon />
          </IconButton>

          <div className="absolute bottom-full translate-y-2">
            <div className={`${isPickerVisible ? "block" : "hidden"}`}>
              <Picker
                data={data}
                previewPosition="none"
                onEmojiSelect={(emoji) =>
                  selectedMessageId
                    ? handleEmojiReaction(emoji, selectedMessageId)
                    : messageOnChange(emoji)
                }
                // onClickOutside={() => setPickerVisible(!isPickerVisible)}
                theme="light"
              />
            </div>
          </div>

          <InputBox
            sx={{
              paddingLeft: "4rem",
            }}
            placeholder="Type Message Here..."
            value={message}
            onChange={messageOnChange}
          />

          <IconButton
            type="submit"
            sx={{
              rotate: "-30deg",
              bgcolor: bgBlue,
              color: "white",
              marginLeft: "1rem",
              "&:hover": {
                bgcolor: bgBlue,
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </form>

      <FileMenu fileMenuAnchor={fileMenuAnchor} setFileMenuAnchor={setFileMenuAnchor} />
    </Fragment>
  );
};

export default AppLayout()(Chat);



