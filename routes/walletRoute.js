const router = require("express").Router();
const { getWallet } = require("../controllers/walletController");


router.get("/:userId", getWallet);

module.exports = router;