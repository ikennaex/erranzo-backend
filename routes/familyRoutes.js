const express = require("express");

const router = express.Router();

const {
  createFamilyLink,
  acceptFamilyLink,
  revokeFamilyLink,
  getLinkedAccounts,
} = require("../controllers/familyController");
const { authToken } = require("../middleware/auth");


router.post(
  "/link",
  authToken,
  createFamilyLink
);


router.post(
  "/link/:linkId/accept",
  authToken,
  acceptFamilyLink
);


router.delete(
  "/link/:linkId",
  authToken,
  revokeFamilyLink
);


router.get(
  "/linked-accounts",
  authToken,
  getLinkedAccounts
);


module.exports = router;