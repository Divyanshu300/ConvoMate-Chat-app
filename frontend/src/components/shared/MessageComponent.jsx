import { Box, Typography } from "@mui/material";
import React, { memo } from "react";
import { lightBlue } from "../../constants/color";
import moment from "moment";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import { motion } from "framer-motion";
import { grayColor } from "../../constants/color";
import{ IconButton }from "@mui/material";
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const MessageComponent = ({ message, user, toggleEmojiPicker  }) => {
  const { sender, content, attachments = [], createdAt } = message;

  const sameSender = sender?._id === user?._id;

  const timeAgo = moment(createdAt).fromNow();

  return (
    <motion.div
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

      {content && <Typography>{content}</Typography>}


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
      {
        message?.reactions?.length > 0 &&
        message?.reactions.map((reaction, index) => {
          return <span key={index}>{reaction.reaction}</span>
        }) 
      }


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
