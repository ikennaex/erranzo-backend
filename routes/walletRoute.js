const router = require("express").Router();
const { getWallet } = require("../controllers/walletController");
const { authToken } = require("../middleware/auth");


router.get("/me", authToken, getWallet);

module.exports = router;