const router = require("express").Router();
const webhook = require("../webhooks/stripeWebhook");

router.post("/stripe", express.raw({ type: "application/json" }), webhook.handleStripeWebhook);

module.exports = router;