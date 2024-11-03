const express = require ("express");
const Route = express.Router();
const authenticateUser = require ('../Middlewares/Adminauth')
const {registerAdmin, loginAdmin, getAllAdmins, forgotPassword, resetPassword, getAllUsers, adminDeleteUserProfile} = require('../Controller/AdminController.js');



Route.post("/registerAdmin", registerAdmin);
Route.put("/loginAdmin", loginAdmin);
Route.get("/getAlladmins", getAllAdmins);
Route.put("/reset", resetPassword);
Route.post("/forgot", forgotPassword);
Route.get("/getAllUsers", getAllUsers);
Route.delete("/deleteUser/:userid", adminDeleteUserProfile);


module.exports = Route
