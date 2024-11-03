const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../Model/Admin.js');
const sendEmail = require('../Services/Mailer.js');
const userModel = require('../Model/DataModel.js')
const mongoose = require('mongoose');


const period = 1000 * 60 * 60 * 24 * 3
const registerAdmin = async (req, res) => {
    try {
      const { email, password, username } = req.body;
  
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res
          .status(400)
          .json({ success: false, message: 'Admin already registered' });
      }
      const existingUsername = await Admin.findOne({ username });
      if (existingUsername) {
        return res
          .status(400)
          .json({ success: false, message: 'Username already taken' });
      }
  
      const adminCount = await Admin.countDocuments();
      const adminId = adminCount + 1;
      const hashPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        email,
        password: hashPassword,
        username,
        adminId, 
      });
      const savedAdmin = await newAdmin.save();
      res
        .status(201)
        .json({ success: true, message: 'Admin created', savedAdmin });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
  

// Login admin
const loginAdmin = async (req, res) => {
    try {
      const { username, password } = req.body
      const isAdmin = await Admin.findOne({ username})
  
      if (!isAdmin) {
        return res
          .status(404)
          .json({ success: false, message: 'Admin not found' })
      }
      const checkAdminPassword = await bcrypt.compare(password, isAdmin.password)
      if (!checkAdminPassword) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid Password' })
      }
  
      jwt.sign(
        { id: isAdmin._id },
        process.env.SECRET,
        { expiresIn: '1hr' },
        async (err, token) => {
          if (err) {
            throw err
          }
          res.cookie('userId', isAdmin._id, { maxAge: period, httpOnly: true })
          res.status(200).json({
            success: true,
            message: 'Admin Login Successfully',
            isAdmin,
            token
          })
        }
      )
    } catch (error) {
      console.error(error)
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' })
    }
  }

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    admin.resetPasswordToken = token;
    admin.resetPasswordExpires = Date.now() + 3600000;
    await admin.save();
    const resetUrl = `http://yourapp.com/reset-password/${token}`;
    const mailOptions = {
      to: email,
      from: process.env.MAIL,
      subject: 'Password Reset',
      text: `You are receiving this email because you (or someone else) have requested a password reset. Please make a PUT request to the following URL with your new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    };

    await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.text); 
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting password reset', error });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    admin.password = await hashPassword(password);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

const getAllAdmins = async (req, res) => {
    try {
     
      const admins = await Admin.find({}, '-password');
      res.status(200).json({ success: true, data: admins });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  const getAllUsers = async (req, res) => {
    try {
      const users = await userModel.find()
      res
        .status(202)
        .json({ success: true, message: 'View all users Successful', users })
    } catch (err) {
      console.log(err.message)
    }
  }
  
  

const adminDeleteUserProfile = async (req, res) => {
  try {
    const { userid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    console.log('Attempting to delete user with ID:', userid);
    const deletedUser = await userModel.findByIdAndDelete(userid);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User profile deleted' });
  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

  

module.exports = {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
  getAllAdmins,
  getAllUsers,
  adminDeleteUserProfile
};
