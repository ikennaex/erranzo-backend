const ErrandModel = require("../models/Errand");
const ReviewModel = require("../models/Review");
const UserModel = require("../models/User");

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