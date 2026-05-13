const router = require("express").Router();
const { createDeposit } = require("../controllers/stripeController");

router.post("/create-deposit", createDeposit);

module.exports = router;