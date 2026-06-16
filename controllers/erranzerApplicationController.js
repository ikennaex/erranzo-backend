const ErranzerApplication = require("../models/ErranzerApplication");
const User = require("../models/User");
const {uploadToCloudinary} = require("../utils/cloudinary");

const applyErranzer = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      bio,
      phone,
      skills,
      availability,
    } = req.body;

    // 1. parse JSON strings
    let parsedSkills;
    let parsedAvailability;

    try {
      parsedSkills = JSON.parse(skills);
      parsedAvailability = JSON.parse(availability);
    } catch (err) {
      return res.status(400).json({
        message: "Invalid skills or availability format",
      });
    }

    // 2. check files
    if (!req.files?.frontId) {
      return res.status(400).json({
        message: "Front ID is required",
      });
    }

    // 3. upload front ID
    const frontIdUrl = await uploadToCloudinary(
      req.files.frontId[0].buffer
    );

    // 4. upload back ID (optional)
    let backIdUrl = null;

    if (req.files?.backId) {
      backIdUrl = await uploadToCloudinary(
        req.files.backId[0].buffer
      );
    }

    // 5. create application
    await ErranzerApplication.create({
      userId,
      bio,
      phone,
      skills: parsedSkills,
      availability: parsedAvailability,
      frontIdUrl,
      backIdUrl,
      status: "pending",
      submittedAt: new Date(),
    });

    // 6. update user KYC status
    await User.findByIdAndUpdate(userId, {
      kycStatus: "pending",
    });

    return res.status(201).json({
      message: "Application submitted successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = { applyErranzer };