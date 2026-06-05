const { RtcTokenBuilder, RtcRole } = require("agora-token");
const { checkCallAuthorization } = require("../utils/callUtils");

/**
 * Generate Agora RTC token
 * POST /api/calls/token
 */
const generateToken = async (req, res) => {
  const { channelName, uid, role, calleeId } = req.body;
  const callerId = req.user.id; // From authToken middleware

  // 1. Validate request payload
  if (!channelName || uid === undefined || uid === null || !role || !calleeId) {
    return res.status(400).json({ 
      message: "Missing required fields: channelName, uid, role, calleeId" 
    });
  }

  // 2. Enforce call authorization (Errand Relationship Check)
  const isAuthorized = await checkCallAuthorization(callerId, calleeId);
  if (!isAuthorized) {
    return res.status(403).json({
      message: "You are not authorized to call this user"
    });
  }

  // 3. Setup Agora Credentials
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error("Agora environment variables are missing");
    return res.status(500).json({ 
      message: "Agora App ID or App Certificate is not configured on the server" 
    });
  }

  // 4. Set Token Role (1-to-1 calls both publish audio)
  const rtcRole = RtcRole.PUBLISHER;

  // 5. Calculate Privilege Expiry (1 hour = 3600 seconds)
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // TODO: Implement token refresh mechanism from the client side as a follow-up task 
  // (e.g., listening to token-privilege-will-expire and requesting a new token)

  try {
    // 6. Build Token
    const parsedUid = Number(uid);
    if (isNaN(parsedUid)) {
      return res.status(400).json({ message: "uid must be a valid number" });
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      parsedUid,
      rtcRole,
      privilegeExpiredTs
    );

    // 7. Return generated token
    return res.status(200).json({
      token,
      channelName,
      uid: parsedUid
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return res.status(500).json({ 
      message: "Failed to generate token" 
    });
  }
};

module.exports = {
  generateToken
};
