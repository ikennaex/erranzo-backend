const { getIO } = require("../config/socket");
const ErrandModel = require("../models/Errand");

const updateErrandLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const { lat, lng, etaMinutes, etaText } = req.body;

    // find errand
    const errand = await ErrandModel.findById(id);

    if (!errand) {
      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // only the assigned erranzer

    if (!errand.erranzer_id || errand.erranzer_id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the assigned erranzer can update location",
      });
    }

    // errand has to be in progress to update location

    if (errand.status !== "in_progress") {
      return res.status(400).json({
        message: "Location can only be updated for an in-progress errand",
      });
    }

    // validate coordinates

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        message: "Invalid coordinates",
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: "Invalid latitude",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: "Invalid longitude",
      });
    }

    // validate ETA minutes

    const parsedEta = Number(etaMinutes);

    if (!Number.isFinite(parsedEta) || parsedEta < 0 || parsedEta > 1440) {
      return res.status(400).json({
        message: "Invalid ETA",
      });
    }

    // validate eta text

    if (
      etaText !== undefined &&
      etaText !== null &&
      typeof etaText !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid etaText",
      });
    }

    // save location and ETA to the errand

    errand.etaMinutes = parsedEta;

    errand.etaUpdatedAt = new Date();

    errand.erranzerLocation = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    await errand.save();

    const io = getIO();
    io.to(errand.poster_id.toString()).emit("eta_update", {
      errandId: errand._id.toString(),
      etaMinutes: parsedEta,
      etaText: etaText || null,
      erranzerLocation: errand.erranzerLocation,
    });
    if (errand.erranzer_id) {
      io.to(errand.erranzer_id.toString()).emit("eta_update", {
        errandId: errand._id.toString(),
        etaMinutes: parsedEta,
        etaText: etaText || null,
        erranzerLocation: errand.erranzerLocation,
      });
    }

    return res.status(200).json({
      message: "Location and ETA updated successfully",

      etaMinutes: parsedEta,

      etaText: etaText || null,

      etaUpdatedAt: errand.etaUpdatedAt,

      erranzerLocation: errand.erranzerLocation,
    });
  } catch (error) {
    console.error("Update errand location error:", error);

    return res.status(500).json({
      message: "Failed to update location and ETA",
      error: error.message,
    });
  }
};

const getErrandEta = async (req, res) => {
  try {
    const { id } = req.params;

    const errand = await ErrandModel.findById(id);

    if (!errand) {
      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // Only poster or assigned erranzer
    const isPoster = errand.poster_id.toString() === req.user.id;

    const isErranzer =
      errand.erranzer_id && errand.erranzer_id.toString() === req.user.id;

    if (!isPoster && !isErranzer) {
      return res.status(403).json({
        message: "You are not authorized to view this ETA",
      });
    }

    const isStale =
      !errand.etaUpdatedAt ||
      Date.now() - new Date(errand.etaUpdatedAt).getTime() > 5 * 60 * 1000;

    return res.status(200).json({
      etaMinutes: errand.etaMinutes,
      etaUpdatedAt: errand.etaUpdatedAt,

      erranzerLocation: errand.erranzerLocation,

      isStale,
    });
  } catch (error) {
    console.error("Get errand ETA error:", error);

    return res.status(500).json({
      message: "Failed to get ETA",
      error: error.message,
    });
  }
};

module.exports = {
  updateErrandLocation,
  getErrandEta,
};
