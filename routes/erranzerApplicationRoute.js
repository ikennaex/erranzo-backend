const express = require("express");
const { authToken } = require("../middleware/auth");
const {
  applyErranzer,
} = require("../controllers/erranzerApplicationController");
const uploadToCloudinary = require("../utils/cloudinary");
const router = express.Router();

router.post(
  "/apply",
  authToken,
  uploadToCloudinary.fields([
    { name: "frontId", maxCount: 1 },
    { name: "backId", maxCount: 1 },
  ]),
  applyErranzer,
);
// router.get("/", getAllErrands)

module.exports = router;
