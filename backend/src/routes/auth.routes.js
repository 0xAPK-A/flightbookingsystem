const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");

// Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/user", authenticate, authController.getUser);
router.get('/verify', authController.verifyEmail);
module.exports = router;
