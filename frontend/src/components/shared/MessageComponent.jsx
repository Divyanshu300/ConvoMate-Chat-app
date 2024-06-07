import { Box, Typography, IconButton } from "@mui/material";
import React, { memo, useEffect, useState } from "react";
import { lightBlue } from "../../constants/color";
import moment from "moment";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import { motion } from "framer-motion";
import { grayColor } from "../../constants/color";
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import axios from "axios"; // Import axios for API calls
import { server } from "../../constants/config";
import { getSocket } from "../../socket";
import { MESSAGE_EDITED } from "../../constants/events";

const MessageComponent = ({ message, user, toggleEmojiPicker }) => {
  const { sender, content, attachments = [], createdAt, edited } = message;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const [canEdit, setCanEdit] = useState(false); // Flag to indicate if message can be edited


  const sameSender = sender?._id === user?._id;
  const timeAgo = moment(createdAt).fromNow();
  const socket = getSocket();


  useEffect(() => {
    // Calculate the difference between current time and message creation time
    const timeDifference = moment().diff(moment(createdAt), 'minutes');

    // Check if the time difference is within the 15-minute limit
    if (timeDifference < 15) {
      setCanEdit(true);
    } else {
      setCanEdit(false);
    }
  }, [createdAt]);


  const handleEdit = async () => {

    if (!canEdit) {
      return; // Editing disabled if the time limit has passed
    }

    const axiosInstance = axios.create({
      baseURL: `${server}`,
      withCredentials: true,
    })

    try {
      const response = await axiosInstance.post(`/api/v1/chat/editmessage`, {
        content: editedContent,
        messageId : message._id
      });

      if (response.data.success) {
        // Emit message edit event to the server
        socket.emit(MESSAGE_EDITED, { messageId: message._id, content: editedContent });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  useEffect(() => {
    // Listen for message edit event from the server
    socket.on(MESSAGE_EDITED, ({ messageId, content }) => {
      if (messageId === message._id) {
        // Update message content with the edited content
        setEditedContent(content);
      }
    });

    return () => {
      // Clean up socket event listener
      socket.off(MESSAGE_EDITED);
    };
  }, [message._id]);

  return (
    <motion.div
      // initial={{ opacity: 0, x: "-100%" }}
      // whileInView={{ opacity: 1, x: 0 }}
      initial={{ opacity: 0, x: "-100%" }}
      whileInView={{ opacity: 1, x: 0 }}
      style={{
        alignSelf: sameSender ? "flex-end" : "flex-start",
        backgroundColor: sameSender ? "#DDF2FD" : grayColor,
        color: "black",
        borderRadius: "5px",
        padding: "0.5rem",
        width: "fit-content",
        marginBottom: "10px", // Add margin for better separation between messages
      }}
    >
      {!sameSender && (
        <Typography color={lightBlue} fontWeight={"600"} variant="caption">
          {sender.name}
        </Typography>
      )}

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      ) : (
        <Typography>
          {content}
          {edited && <span style={{ fontStyle: "italic", fontSize: "0.8em" }}> (edited)</span>}
        </Typography>
      )}

      {sameSender && !isEditing && canEdit && (
        <IconButton onClick={() => setIsEditing(true)}>
          <EditIcon />
        </IconButton>
      )}

      {sameSender && isEditing && canEdit && (
        <IconButton onClick={handleEdit}>
          <SaveIcon />
        </IconButton>
      )}

      <IconButton
        className={`${sameSender ? "right-[100%]" : "left-[100%]"}`}
        sx={{
          position: "absolute",
          color: "white",
          transform: "translateY(-50%)",
        }}
        onClick={() => toggleEmojiPicker(message._id)}
      >
        <EmojiEmotionsIcon />
      </IconButton>

      {message?.reactions?.length > 0 &&
        message?.reactions.map((reaction, index) => {
          return <span key={index}>{reaction.reaction}</span>;
        })}

      {attachments.length > 0 &&
        attachments.map((attachment, index) => {
          const url = attachment.url;
          const file = fileFormat(url);

          return (
            <Box key={index}>
              <a
                href={url}
                target="_blank"
                download
                style={{
                  color: "black",
                }}
              >
                {RenderAttachment(file, url)}
              </a>
            </Box>
          );
        })}

      <Typography variant="caption" color={"text.secondary"}>
        {timeAgo}
      </Typography>
    </motion.div>
  );
};

export default memo(MessageComponent);

