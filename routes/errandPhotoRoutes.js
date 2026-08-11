const express = require("express");
const router = express.Router();
const {
  uploadErrandPhotos,
  getErrandPhotos,
  deleteErrandPhoto,
} = require("../controllers/errandPhotoController");
const { authToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post(
  "/:id/photos",
  authToken,
  upload.array("photos", 5),
  uploadErrandPhotos,
);

router.get("/:id/photos", authToken, getErrandPhotos);
router.delete("/:id/photos/:photoId", authToken, deleteErrandPhoto);

module.exports = router;
