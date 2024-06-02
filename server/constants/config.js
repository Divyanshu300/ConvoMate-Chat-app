import dotenv from "dotenv";
dotenv.config();


const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE","OPTIONS"],
  credentials: true,
};

console.log(" hyy: ",process.env.CLIENT_URL);

const CONVOMATE_TOKEN = "convomate-token";

export { corsOptions, CONVOMATE_TOKEN };
