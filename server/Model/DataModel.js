// models/User.js

const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // Track if the user has verified their email
    },
    otp: {
      type: String,
    },
    otpExpiration: {
      type: Date,
    },
    verificationToken: {
      type: String,
    },
    tokenExpiration: {
      type: Date,
    },
  },
  { timestamps: true }
);



const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
