const express = require("express");
const Routes = express.Router();
const authenticateUser = require ('../Middlewares/Userauth')

const {
  registerUser,
  loginUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
  DeleteUserProfile,
  changePassword
} = require("../Controller/Controller.js");

Routes.post("/registeruser", registerUser);
Routes.post("/loginuser", loginUser);
Routes.post("/verifyOTP", verifyOTP);
Routes.post("/forgotPassword", forgotPassword);
Routes.post('/resetPassword/:userId/:token', resetPassword);
Routes.delete('/deleteUserProfile', authenticateUser, DeleteUserProfile);
Routes.put('/change-password', authenticateUser, changePassword);




module.exports = Routes;
