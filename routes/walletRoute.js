const router = require("express").Router();
const { getWallet, getTransactions } = require("../controllers/walletController");
const { authToken } = require("../middleware/auth");


router.get("/me", authToken, getWallet);
router.get("/transactions", authToken, getTransactions);

module.exports = router;