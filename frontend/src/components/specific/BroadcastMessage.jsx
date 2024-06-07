import React, { useState } from 'react';
import axios from 'axios';
import { server } from '../../constants/config';
import { useSelector } from 'react-redux';

import { InputBox } from "../../components/styles/StyledComponents";
import { Send as SendIcon } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { bgBlue } from "../../constants/color";
import toast from 'react-hot-toast';

const Broadcast = () => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const { user } = useSelector((state) => state.auth);

    const handleBroadcast = async () => {

        if (!user || !user._id) {
            // console.error("User is not logged in or user ID is missing.");
            toast.error("User is not authenticated.");
            return;
        }

        const userId = user._id;
        
        const axiosInstance = axios.create({
            baseURL:` ${server}`,
            withCredentials: true,
        });

        try {
            // Log the request details
            console.log("Sending request to: ",` ${server}/api/v1/admin/users/broadcast`);
            console.log("Request payload: ", { message, userId });

            const response = await axiosInstance.post(`/api/v1/admin/users/broadcast`, { message, userId });
            // console.log("Response: ", response.data.success);
            // setStatus(response.data.success);
            toast.success(response.data.success);
            
        } 
        catch (error) {
            console.log("Error: ", error);
            if (error.response) {
                console.log("Error response data: ", error.response.data);
                toast.error(error.response.data.error || 'Broadcast failed');
            } else {
                toast.error('Broadcast failed');
            }
        }
        finally {
            setMessage("")
        }
    };

    return (
        <div>
            <form className="absolute bottom-9 left-[90px]">
                <InputBox
                    sx={{
                        padding: "1rem",
                        width: "30vw",
                        bgcolor: "#164863",
                        color: "white"
                    }}
                    placeholder="Broadcast message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <IconButton
                    onClick={handleBroadcast}
                    sx={{
                        rotate: "-30deg",
                        bgcolor: bgBlue,
                        color: "white",
                        marginLeft: "1rem",
                        padding: "0.5rem",
                        "&:hover": {
                            bgcolor: "error.dark",
                        },
                    }}
                >
                    <SendIcon />
                </IconButton>
                {/* {status && <p>{status}</p>} */}
            </form>
        </div>
    );
};

export default Broadcast;