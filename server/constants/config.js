import dotenv from "dotenv";
dotenv.config();


const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE","OPTIONS"],
  credentials: true,
};

console.log(" hyy: ",process.env.CLIENT_URL);

const QUICKCHAT_TOKEN = "quickchat-token";

export { corsOptions, QUICKCHAT_TOKEN };
