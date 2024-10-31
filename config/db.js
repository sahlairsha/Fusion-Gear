const mongoose = require("mongoose");
const env = require("dotenv").config();
const User = require("../models/userSchema"); // Adjust the path as needed

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Mongodb is connected....");

        const collection = mongoose.connection.collection("users");

        // Check existing indexes
        const indexes = await collection.indexes();

        // Drop existing googleId index if not sparse
        const googleIdIndex = indexes.find(index => index.name === "googleId_1" && !index.sparse);
        if (googleIdIndex) {
            await collection.dropIndex("googleId_1");
            console.log("Dropped existing googleId index");
        }

        // Reinitialize indexes on the model
        await User.init();
        // console.log("Indexes reinitialized successfully with sparse:true on googleId");

    } catch (error) {
        console.log("Db connection error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
