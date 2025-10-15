const express = require("express");
const { forgotPassword } = require("../controllers/ForgotPasswordController");
const { resetPassword } = require("../controllers/ResetPasswordController");
const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
