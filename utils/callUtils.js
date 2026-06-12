const ErrandModel = require("../models/Errand");

/**
 * Checks if two users have an active "in_progress" errand relationship.
 * A call is only authorized if one user is the poster and the other is the erranzer.
 * 
 * @param {string} callerId 
 * @param {string} calleeId 
 * @returns {Promise<boolean>}
 */
const checkCallAuthorization = async (callerId, calleeId) => {
  try {
    const errand = await ErrandModel.findOne({
      status: "in_progress",
      $or: [
        { poster_id: callerId, erranzer_id: calleeId },
        { poster_id: calleeId, erranzer_id: callerId }
      ]
    });

    return !!errand;
  } catch (error) {
    console.error("Error checking call authorization:", error);
    return false;
  }
};

module.exports = {
  checkCallAuthorization
};
