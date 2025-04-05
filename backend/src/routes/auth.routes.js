const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");
const { resendVerificationEmail } = require("../controllers/auth.controller");
// Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/user", authenticate, authController.getUser);
router.get('/verify', authController.verifyEmail);

router.post('/resend-verification', resendVerificationEmail);
module.exports = router;
