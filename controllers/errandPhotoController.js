const ErrandModel = require("../models/Errand");
const ErrandPhotoModel = require("../models/ErrandPhoto");
const UserModel = require("../models/User");

const {
  uploadToCloudinary,
} = require("../utils/cloudinary");

const cloudinary = require("../config/cloudinary");

const {
  sendPushNotification,
} = require("../notifications/notificationService");



const uploadErrandPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      phase,
      caption,
    } = req.body;


    if (!["before", "after"].includes(phase)) {
      return res.status(400).json({
        message:
          "Phase must be either before or after",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one photo",
      });
    }


    const errand = await ErrandModel.findById(id);

    if (!errand) {
      return res.status(404).json({
        message: "Errand not found",
      });
    }

    if (
      !errand.erranzer_id ||
      errand.erranzer_id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message:
          "Only the assigned erranzer can upload photos",
      });
    }

    if (errand.status !== "in_progress") {
      return res.status(400).json({
        message:
          "Photos can only be uploaded while the errand is in progress",
      });
    }


    if (errand.disputeStatus === "open") {
      return res.status(400).json({
        message:
          "Photos cannot be uploaded while the errand is under dispute",
      });
    }

    const existingPhotoCount =
      await ErrandPhotoModel.countDocuments({
        errandId: errand._id,
        phase,
      });

    if (existingPhotoCount >= 5) {
      return res.status(400).json({
        message:
          `Maximum of 5 ${phase} photos allowed`,
      });
    }

    if (
      existingPhotoCount +
        req.files.length >
      5
    ) {
      return res.status(400).json({
        message:
          `You can only upload ${
            5 - existingPhotoCount
          } more ${phase} photo(s)`,
      });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const folder =
        `errand_photos/${errand._id}/${phase}`;

      const result =
        await uploadToCloudinary(
          file.buffer,
          folder,
          true
        );

      const photo =
        await ErrandPhotoModel.create({
          errandId: errand._id,
          uploadedBy: req.user.id,
          phase,
          imageUrl: result.secure_url,
          publicId: result.public_id,
          caption: caption || "",
        });

      uploadedPhotos.push(photo);
    }


    if (phase === "after") {
      const poster =
        await UserModel.findById(
          errand.poster_id
        ).select("pushToken");

      if (poster?.pushToken) {
        await sendPushNotification(
          poster.pushToken,
          "Errand completed photos uploaded",
          {
            errandId:
              errand._id.toString(),

            type: "errand_after_photos",
          }
        );
      }
    }

    return res.status(201).json({
      message:
        `${phase} photos uploaded successfully`,

      photos: uploadedPhotos,
    });

  } catch (error) {
    console.error(
      "Upload errand photos error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to upload errand photos",
      error: error.message,
    });
  }
};

const getErrandPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const errand = await ErrandModel.findById(id);

    if (!errand) {
      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // ==========================================
    // ONLY POSTER OR ASSIGNED ERRANZER
    // ==========================================

    const isPoster =
      errand.poster_id.toString() ===
      req.user.id;

    const isErranzer =
      errand.erranzer_id &&
      errand.erranzer_id.toString() ===
        req.user.id;

    if (!isPoster && !isErranzer) {
      return res.status(403).json({
        message:
          "You are not authorized to view these photos",
      });
    }

    const photos =
      await ErrandPhotoModel.find({
        errandId: errand._id,
      })
        .sort({ createdAt: 1 })
        .lean();

    const before = photos.filter(
      (photo) => photo.phase === "before"
    );

    const after = photos.filter(
      (photo) => photo.phase === "after"
    );

    return res.status(200).json({
      before,
      after,
    });

  } catch (error) {
    console.error(
      "Get errand photos error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get errand photos",
      error: error.message,
    });
  }
};

const deleteErrandPhoto = async (req, res) => {
  try {
    const {
      id,
      photoId,
    } = req.params;

    const photo =
      await ErrandPhotoModel.findById(
        photoId
      );

    if (!photo) {
      return res.status(404).json({
        message: "Photo not found",
      });
    }

    if (
      photo.errandId.toString() !== id
    ) {
      return res.status(400).json({
        message:
          "Photo does not belong to this errand",
      });
    }

    if (
      photo.uploadedBy.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message:
          "Only the erranzer who uploaded the photo can delete it",
      });
    }

    const twentyFourHours =
      24 * 60 * 60 * 1000;

    const photoAge =
      Date.now() -
      new Date(
        photo.createdAt
      ).getTime();

    if (photoAge > twentyFourHours) {
      return res.status(400).json({
        message:
          "Photos can only be deleted within 24 hours of upload",
      });
    }

    await cloudinary.uploader.destroy(
      photo.publicId
    );

    await ErrandPhotoModel.findByIdAndDelete(
      photo._id
    );

    return res.status(200).json({
      message:
        "Photo deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete errand photo error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete errand photo",
      error: error.message,
    });
  }
};


module.exports = {
  uploadErrandPhotos,
  getErrandPhotos,
  deleteErrandPhoto,
};