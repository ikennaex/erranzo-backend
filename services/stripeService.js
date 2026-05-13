const stripe = require("../config/stripe");

exports.createPaymentIntent = async (amount, userId) => {
  return await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "cad",
    automatic_payment_methods: { enabled: true },
    metadata: { userId },
  });
};