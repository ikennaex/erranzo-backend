const stripeService = require("../services/stripeService");

const createDeposit = async (req, res) => {
  const { amount, userId } = req.body;

  const paymentIntent = await stripeService.createPaymentIntent(amount, userId);

  res.json({
    clientSecret: paymentIntent.client_secret,
  });
};

module.exports = {createDeposit}