    //create an instance of mongoose
const mongoose = require("mongoose");

//enabling to access environment file
require("dotenv").config();

//establishing a connection with database
exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL)
    .then(
        console.log("DB Connection Successful")
    )
    .catch((error) => {
        console.log("DB connection Issues");
        console.error(error);
        process.exit(1);
    })
};

