const ErrandModel = require("../models/Errand");
const ReviewModel = require("../models/Review");
const UserModel = require("../models/User");
const { sendPushNotification, TEMPLATES } = require("../notifications/notificationService");

const postReview = async (req, res) => {
  try {
    const { errandId, erranzerId, rating, comment } = req.body;

    const reviewerId = req.user.id;

    // Check errand exists
    const errand = await ErrandModel.findById(errandId);

    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }

    // Ensure errand is completed
    if (errand.status !== "completed") {
      return res.status(400).json({ message: "Errand not completed yet" });
    }

    // Prevent duplicate review
    const existingReview = await ReviewModel.findOne({
      errandId,
      reviewerId,
    });

    if (existingReview) {
      return res.status(400).json({ message: "You already reviewed this errand" });
    }

    // Create review
    await ReviewModel.create({
      errandId,
      erranzerId,
      reviewerId,
      rating,
      comment,
    });

    // Recalculate rating
    const reviews = await ReviewModel.find({ erranzerId });

    const total = reviews.length;

    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    // Update user
    await UserModel.findByIdAndUpdate(erranzerId, {
      averageRating: avg,
      totalReviews: total,
    });

    try {
      const reviewer = await UserModel.findById(reviewerId).select("firstName lastName");
      const erranzer = await UserModel.findById(erranzerId).select("pushToken");
      if (erranzer?.pushToken && reviewer) {
        await sendPushNotification(
          erranzer.pushToken,
          TEMPLATES.REVIEW_RECEIVED(`${reviewer.firstName} ${reviewer.lastName}`),
          { type: "review_received", erranzerId: erranzerId.toString() }
        );
      }
    } catch (err) {
      console.error("Review push notification error:", err);
    }

    res.status(201).json({
      message: "Review submitted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

const getReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const reviews = await ReviewModel.find({ erranzerId: id }).populate("reviewerId", "username");
        res.status(200).json({ reviews });
        
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch reviews",
            error: err.message,
        });
    }
}

module.exports = { postReview, getReviews };