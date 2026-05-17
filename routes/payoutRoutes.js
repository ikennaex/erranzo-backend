const router = require("express").Router();

const { createConnectAccount, withdrawFunds } = require("../controllers/payoutController");
const { authToken } = require("../middleware/auth");

router.post("/connect-account", authToken, createConnectAccount);
router.post("/withdraw", authToken, withdrawFunds);

module.exports = router;
