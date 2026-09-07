const express = require("express");
const { authToken } = require("../middleware/auth");
const {
  applyErranzer,
  reuploadFacePhoto,
  getMyApplication,
} = require("../controllers/erranzerApplicationController");
const upload = require("../middleware/upload");
const router = express.Router();

router.post(
  "/apply",
  authToken,
  upload.fields([
    { name: "frontId", maxCount: 1 },
    { name: "backId", maxCount: 1 },
    { name: "facePhoto", maxCount: 1 },
  ]),
  applyErranzer,
);

// Re-upload face photo endpoints
router.post(
  "/re-upload-face",
  authToken,
  upload.fields([{ name: "facePhoto", maxCount: 1 }]),
  reuploadFacePhoto,
);

router.patch(
  "/application/face-photo",
  authToken,
  upload.fields([{ name: "facePhoto", maxCount: 1 }]),
  reuploadFacePhoto,
);

router.post(
  "/application/face-photo",
  authToken,
  upload.fields([{ name: "facePhoto", maxCount: 1 }]),
  reuploadFacePhoto,
);

// Get current user's Erranzer application details
router.get("/application", authToken, getMyApplication);

module.exports = router;
