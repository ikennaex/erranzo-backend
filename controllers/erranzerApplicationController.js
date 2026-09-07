const ErranzerApplication = require("../models/ErranzerApplication");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

const applyErranzer = async (req, res) => {
  try {
    const userId = req.user.id;

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
      parsedSkills = typeof skills === "string" ? JSON.parse(skills) : (skills || []);
      parsedAvailability = typeof availability === "string" ? JSON.parse(availability) : (availability || {});
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

    if (!req.files?.facePhoto) {
      return res.status(400).json({
        message: "Face verification photo is required",
      });
    }

    // 3. upload front ID
    const frontIdUrl = await uploadToCloudinary(
      req.files.frontId[0].buffer,
      "erranzer_ids"
    );

    // 4. upload back ID (optional)
    let backIdUrl = null;

    if (req.files?.backId) {
      backIdUrl = await uploadToCloudinary(
        req.files.backId[0].buffer,
        "erranzer_ids"
      );
    }

    // 5. upload face photo
    let facePhotoUrl = null;
    let facePhotoPublicId = null;

    if (req.files?.facePhoto) {
      const faceResult = await uploadToCloudinary(
        req.files.facePhoto[0].buffer,
        "erranzer_faces",
        true
      );
      facePhotoUrl =
        typeof faceResult === "object" ? faceResult.secure_url : faceResult;
      facePhotoPublicId =
        typeof faceResult === "object" ? faceResult.public_id : null;
    }

    // 6. create application
    const application = await ErranzerApplication.create({
      userId,
      bio,
      phone,
      skills: parsedSkills,
      availability: parsedAvailability,
      frontIdUrl,
      backIdUrl,
      facePhotoUrl,
      facePhotoPublicId,
      facePhotoStatus: "pending",
      status: "pending",
      submittedAt: new Date(),
    });

    // 7. update user KYC status & applicationStatus
    await User.findByIdAndUpdate(userId, {
      kycStatus: "pending",
      applicationStatus: "pending",
      rejectionReason: null,
    });

    return res.status(201).json({
      message: "Application submitted successfully.",
      applicationId: application._id,
    });

  } catch (error) {
    console.error("Error applying for Erranzer:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const reuploadFacePhoto = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const facePhotoFile =
      req.file ||
      req.files?.facePhoto?.[0] ||
      (Array.isArray(req.files) ? req.files[0] : null);

    if (!facePhotoFile) {
      return res.status(400).json({
        message: "Face photo is required. Please capture or upload a new photo.",
      });
    }

    // Upload new face photo to Cloudinary
    const faceResult = await uploadToCloudinary(
      facePhotoFile.buffer,
      "erranzer_faces",
      true
    );
    const facePhotoUrl =
      typeof faceResult === "object" ? faceResult.secure_url : faceResult;
    const facePhotoPublicId =
      typeof faceResult === "object" ? faceResult.public_id : null;

    // Find the latest Erranzer application for this user
    let application = await ErranzerApplication.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!application) {
      return res.status(404).json({
        message: "No existing Erranzer application found for this account.",
      });
    }

    // Update application
    application.facePhotoUrl = facePhotoUrl;
    if (facePhotoPublicId) {
      application.facePhotoPublicId = facePhotoPublicId;
    }
    application.facePhotoStatus = "pending";
    application.status = "pending";
    application.rejectionReason = null;
    await application.save();

    // Reset user rejection & update KYC status
    await User.findByIdAndUpdate(userId, {
      kycStatus: "pending",
      applicationStatus: "pending",
      rejectionReason: null,
    });

    return res.status(200).json({
      message: "New verification photo submitted successfully! It is now pending review.",
      facePhotoUrl,
      applicationId: application._id,
    });
  } catch (error) {
    console.error("Error re-uploading face photo:", error);
    return res.status(500).json({
      message: "Failed to upload new face photo",
      error: error.message,
    });
  }
};

const getMyApplication = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const application = await ErranzerApplication.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!application) {
      return res.status(404).json({ message: "No application found" });
    }

    return res.status(200).json({ application });
  } catch (error) {
    console.error("Error fetching application:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  applyErranzer,
  reuploadFacePhoto,
  getMyApplication,
};