const bcrypt = require("bcryptjs");
const userModel = require("../Model/DataModel.js");
const jwt = require("jsonwebtoken");
const sendEmail = require("../Services/Mailer.js");
const mongoose = require("mongoose");
const { validationResult } = require('express-validator');

const period = 1000 * 60 * 60 * 24 * 3;

const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    // Generate OTP and expiration
    const otp = generateOTP();
    const otpExpiration = Date.now() + 3600000; // 1 hour from now

    // Create new user
    const newUser = new userModel({
      username,
      email,
      password: hashPassword,
      isVerified: false,
      otp,
      otpExpiration,
    });

    await newUser.save();

    // Send OTP email
    await sendEmail(
      newUser.email,
      "Email Verification",
      `Your OTP for verification is: ${otp}`,
      `<p>Your OTP for verification is: <strong>${otp}</strong></p>`
    );

    res.status(200).json({
      success: true,
      message: "Registration successful. Please check your email for the OTP.",
    });
  } catch (err) {
    console.error("Error during user registration:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const user = await userModel.findOne({
      email,
      otp,
      otpExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error("Error during OTP verification:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUser = await userModel.findOne({ email });

    if (!isUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const checkUserPassword = await bcrypt.compare(password, isUser.password);
    if (!checkUserPassword) {
      return res.status(401).json({ success: false, message: 'Invalid Password' });
    }

    jwt.sign(
      { id: isUser._id },
      process.env.SECRET,
      { expiresIn: '1hr' },
      (err, token) => {
        if (err) {
          throw err;
        }
        res.status(200).json({
          success: true,
          message: 'User Login Successfully',
          token, // Include the token in the response
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const jwt_SECRET = process.env.JWT_SECRET;

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      jwt_SECRET,
      { expiresIn: "10m" }
    );

    const resetLink = `http://localhost:5174/resetpassword/${user._id}/${token}`;

    const mailOptions = {
      to: email,
      subject: "Password Reset",
      html: `Click <a href="${resetLink}">here</a> to reset your password.`,
    };

    await sendEmail(mailOptions.to, mailOptions.subject, "", mailOptions.html);

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const { newPassword } = req.body; 

    if (typeof newPassword !== "string" || newPassword.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid new password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await userModel.findById(userId).select("password").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Verify the token using the same secret
    jwt.verify(token, jwt_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token" });
      }

      // Ensure the token payload matches the userId
      if (decoded.id !== userId) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid token" });
      }
    });

    // Check if the new password is different from the old password
    const passwordsMatch = await bcrypt.compare(newPassword, user.password);
    if (passwordsMatch) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password must be different from the old one",
        });
    }

    // Update the user's password
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error resetting password" });
  }
};

const DeleteUserProfile = async (req, res) => {
  try {
    // Use the user ID from the decoded token (req.user.id)
    const userId = req.user.id;
    
    const user = await userModel.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ success: true, message: 'User profile deleted' });
  } catch (error) {
    console.error('Error deleting user profile:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token found' });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password is too short' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};







module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
  DeleteUserProfile,
  changePassword
};
