const FamilyLinkModel = require("../models/FamilyLink");
const UserModel = require("../models/User");
const sendFamilyInvitationMail = require("../utils/emails/sendFamilyInvitationEmail");

const createFamilyLink = async (req, res) => {
  try {
    const guardianId = req.user.id;

    const { seniorEmail, relationship } = req.body;

    // Guardian check
    const guardian = await UserModel.findById(guardianId);

    if (!guardian) {
      return res.status(404).json({
        message: "Guardian not found",
      });
    }

    if (guardian.accountType !== "guardian") {
      return res.status(403).json({
        message: "Only guardians can create family links",
      });
    }

    // Find senior
    const senior = await UserModel.findOne({
      email: seniorEmail.toLowerCase(),
    });

    if (!senior) {
      return res.status(404).json({
        message: "Senior account not found",
      });
    }

    // Cannot link yourself
    if (senior._id.toString() === guardianId) {
      return res.status(400).json({
        message: "You cannot link your own account",
      });
    }

    // Must actually be a senior
    if (senior.accountType !== "senior") {
      return res.status(400).json({
        message: "This account is not registered as a senior account",
      });
    }

    // ==========================================
    // MAX 5 SENIORS PER GUARDIAN
    // ==========================================

    const seniorCount = await FamilyLinkModel.countDocuments({
      guardianId,
      status: {
        $in: ["pending", "active"],
      },
    });

    if (seniorCount >= 5) {
      return res.status(400).json({
        message: "Guardian cannot have more than 5 linked seniors",
      });
    }

    // ==========================================
    // MAX 3 GUARDIANS PER SENIOR
    // ==========================================

    const guardianCount = await FamilyLinkModel.countDocuments({
      seniorId: senior._id,
      status: {
        $in: ["pending", "active"],
      },
    });

    if (guardianCount >= 3) {
      return res.status(400).json({
        message: "Senior cannot have more than 3 guardians",
      });
    }

    // ==========================================
    // CHECK EXISTING LINK
    // ==========================================

    const existingLink = await FamilyLinkModel.findOne({
      guardianId,
      seniorId: senior._id,
    });

    if (existingLink && existingLink.status !== "revoked") {
      return res.status(400).json({
        message: "A family link already exists",
      });
    }

    // ==========================================
    // CREATE LINK
    // ==========================================

    let link;

    if (existingLink) {
      existingLink.status = "pending";
      existingLink.relationship = relationship;

      link = await existingLink.save();
    } else {
      link = await FamilyLinkModel.create({
        guardianId,
        seniorId: senior._id,
        relationship,
        status: "pending",
      });
    }


    await sendFamilyInvitationMail({
      email: senior.email,
      seniorFirstName: senior.firstName,
      guardianFirstName: guardian.firstName,
      relationship,
      linkId: link._id.toString(),
    });

    return res.status(201).json({
      message: "Family link invitation sent",
      link,
    });
  } catch (error) {
    console.error("Create family link error:", error);

    return res.status(500).json({
      message: "Failed to create family link",
      error: error.message,
    });
  }
};

const acceptFamilyLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await FamilyLinkModel.findById(linkId);

    if (!link) {
      return res.status(404).json({
        message: "Family link not found",
      });
    }

    // Only the senior can accept
    if (link.seniorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the senior can accept this invitation",
      });
    }

    if (link.status !== "pending") {
      return res.status(400).json({
        message: "This family link is no longer pending",
      });
    }

    link.status = "active";

    await link.save();

    return res.status(200).json({
      message: "Family link accepted",
      link,
    });
  } catch (error) {
    console.error("Accept family link error:", error);

    return res.status(500).json({
      message: "Failed to accept family link",
      error: error.message,
    });
  }
};

const revokeFamilyLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await FamilyLinkModel.findById(linkId);

    if (!link) {
      return res.status(404).json({
        message: "Family link not found",
      });
    }

    const isGuardian = link.guardianId.toString() === req.user.id;

    const isSenior = link.seniorId.toString() === req.user.id;

    if (!isGuardian && !isSenior) {
      return res.status(403).json({
        message: "You are not part of this family link",
      });
    }

    link.status = "revoked";

    await link.save();

    return res.status(200).json({
      message: "Family link revoked",
    });
  } catch (error) {
    console.error("Revoke family link error:", error);

    return res.status(500).json({
      message: "Failed to revoke family link",
      error: error.message,
    });
  }
};

const getLinkedAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const asGuardian = await FamilyLinkModel.find({
      guardianId: userId,
      status: "active",
    }).populate("seniorId", "firstName lastName email accountType");

    const asSenior = await FamilyLinkModel.find({
      seniorId: userId,
      status: "active",
    }).populate("guardianId", "firstName lastName email accountType");

    return res.status(200).json({
      asGuardian,
      asSenior,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get linked accounts",
      error: error.message,
    });
  }
};

module.exports = {
  createFamilyLink,
  acceptFamilyLink,
  revokeFamilyLink,
  getLinkedAccounts,
};
