const { default: mongoose } = require("mongoose");
const ErrandModel = require("../models/Errand");
const {
  sendNotification,
} = require("../utils/notifications/errandnotification");
const UserModel = require("../models/User");

const {
  sendPushNotification,
  TEMPLATES,
} = require("../notifications/notificationService");
const WalletModel = require("../models/Wallet");
const TransactionModel = require("../models/Transaction");

// post errand has wallet debit with escrow and also a transaction
const postErrand = async (req, res) => {
  const {
    title,
    description,
    budget,
    deadline,
    category,
    location,
    address,
    status,
    priority,
    onBehalfOf,
    isEmergency = false,
  } = req.body;

  try {
    const guardianId = req.user.id;

    // ==========================================
    // DETERMINE WHO IS POSTING / PAYING
    // ==========================================

    let posterId = guardianId;
    let bookedBy = null;
    let payerId = guardianId;

    // ==========================================
    // NORMAL ERRAND
    // ==========================================

    if (!onBehalfOf) {
      posterId = guardianId;
      bookedBy = null;
      payerId = guardianId;
    }

    // ==========================================
    // GUARDIAN BOOKING FOR SENIOR
    // ==========================================

    if (onBehalfOf) {
      // ------------------------------------------
      // Check guardian
      // ------------------------------------------

      const guardian = await UserModel.findById(guardianId);

      if (!guardian) {
        return res.status(404).json({
          message: "Guardian account not found",
        });
      }

      if (guardian.accountType !== "guardian") {
        return res.status(403).json({
          message:
            "Only guardians can book on behalf of seniors",
        });
      }

      // ------------------------------------------
      // Check senior
      // ------------------------------------------

      const senior = await UserModel.findById(onBehalfOf);

      if (!senior) {
        return res.status(404).json({
          message: "Senior account not found",
        });
      }

      if (senior.accountType !== "senior") {
        return res.status(400).json({
          message:
            "The selected account is not a senior account",
        });
      }

      // ------------------------------------------
      // Check active FamilyLink
      // ------------------------------------------

      const familyLink = await FamilyLinkModel.findOne({
        guardianId: guardianId,
        seniorId: onBehalfOf,
        status: "active",
      });

      if (!familyLink) {
        return res.status(403).json({
          message:
            "You do not have an active family link with this senior",
        });
      }

      // ------------------------------------------
      // Set ownership / payment
      // ------------------------------------------

      posterId = senior._id;
      bookedBy = guardianId;
      payerId = guardianId;
    }

    // ==========================================
    // VALIDATE BUDGET
    // ==========================================

    const parsedBudget = Number(budget);

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      return res.status(400).json({
        message: "Invalid budget",
      });
    }

    // ==========================================
    // EMERGENCY SETTINGS
    // ==========================================

    const emergencyRate =
      Number(process.env.EMERGENCY_SURCHARGE_RATE) || 0.25;

    const emergencyMinBudget =
      Number(process.env.EMERGENCY_MIN_BUDGET) || 30;

    let emergencySurcharge = 0;
    let emergencyExpiresAt = null;

    let finalPriority = priority || "normal";

    // ==========================================
    // EMERGENCY VALIDATION
    // ==========================================

    if (isEmergency === true) {
      // ----------------------------------------
      // Minimum emergency budget
      // ----------------------------------------

      if (parsedBudget < emergencyMinBudget) {
        return res.status(400).json({
          message: `Emergency errands require a minimum budget of ${emergencyMinBudget} CAD`,
        });
      }

      // ----------------------------------------
      // Maximum 3 emergency errands
      // within 24 hours
      // ----------------------------------------

      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      );

      let emergencyQuery;

      // If guardian is booking for a senior,
      // count the guardian's emergency bookings.
      if (bookedBy) {
        emergencyQuery = {
          bookedBy: bookedBy,
          isEmergency: true,
          createdAt: {
            $gte: twentyFourHoursAgo,
          },
        };
      } else {
        // Normal user
        emergencyQuery = {
          poster_id: posterId,
          isEmergency: true,
          createdAt: {
            $gte: twentyFourHoursAgo,
          },
        };
      }

      const emergencyCount =
        await ErrandModel.countDocuments(
          emergencyQuery
        );

      if (emergencyCount >= 3) {
        return res.status(429).json({
          message:
            "You can only create 3 emergency errands within 24 hours",
        });
      }

      // ----------------------------------------
      // Calculate emergency surcharge
      // ----------------------------------------

      emergencySurcharge = Number(
        (parsedBudget * emergencyRate).toFixed(2)
      );

      // ----------------------------------------
      // Emergency expires after 2 hours
      // ----------------------------------------

      emergencyExpiresAt = new Date(
        Date.now() + 2 * 60 * 60 * 1000
      );

      // Emergency errands are always urgent
      finalPriority = "urgent";
    }

    // ==========================================
    // CALCULATE TOTAL REQUIRED
    // ==========================================

    const totalRequired =
      parsedBudget + emergencySurcharge;

    // ==========================================
    // CHECK PAYER WALLET
    // ==========================================

    const wallet = await WalletModel.findOne({
      userId: payerId,
    });

    if (!wallet || wallet.balance < totalRequired) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: totalRequired,
        available: wallet ? wallet.balance : 0,
      });
    }

    // ==========================================
    // CREATE ERRAND
    // ==========================================

    const newErrand = await ErrandModel.create({
      title,
      description,

      budget: parsedBudget,

      deadline,

      category,

      location,

      address,

      status: status || "open",

      priority: finalPriority,

      // ----------------------------------------
      // FAMILY ACCOUNT FIELDS
      // ----------------------------------------

      poster_id: posterId,

      bookedBy: bookedBy,

      onBehalfOf: onBehalfOf || null,

      // ----------------------------------------
      // EMERGENCY FIELDS
      // ----------------------------------------

      isEmergency: isEmergency === true,

      emergencySurcharge,

      emergencyExpiresAt,
    });

    const erranzers = await UserModel.find({
      role: "erranzer",
      pushToken: {
        $exists: true,
        $ne: null,
      },
      _id: {
        $ne: posterId,
      },
    }).select("pushToken");

    if (erranzers.length > 0) {
      const tokens = erranzers.map(
        (e) => e.pushToken
      );

      if (isEmergency === true) {
        await sendPushNotification(
          tokens,
          "Emergency Errand",
          {
            errandId:
              newErrand._id.toString(),

            type: "emergency_errand",

            channelId: "emergency",
          }
        );
      } else {
        await sendPushNotification(
          tokens,
          TEMPLATES.ERRAND_POSTED(
            newErrand.title
          ),
          {
            errandId:
              newErrand._id.toString(),

            type: "errand_posted",
          }
        );
      }
    }

    // ==========================================
    // IN-APP NOTIFICATION
    // ==========================================

    await sendNotification({
      recipientId: "all",

      senderId: guardianId,

      errandId: newErrand._id,

      type: isEmergency
        ? "emergency_errand"
        : "errand_posted",

      message: isEmergency
        ? `Emergency errand posted: ${newErrand.title}`
        : `${req.user.name || "Someone"} just posted a new errand: ${newErrand.title}`,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      message: isEmergency
        ? "Emergency errand posted successfully"
        : "Errand posted successfully",

      newErrand,
    });
  } catch (error) {
    console.error(
      "Post errand error:",
      error
    );

    return res.status(500).json({
      message: "Failed to post errand",
      error: error.message,
    });
  }
};

const getAllErrands = async (req, res) => {
  try {
    const { search, lat, lng, radius = 25 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Geospatial filter
    const hasLocationFilter = lat && lng;

    if (hasLocationFilter) {
      const radiusInMeters = Number(radius) * 1000;

      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    const errands = await ErrandModel.find(query);

    res.status(200).json({
      message: "All errands fetched successfully",
      count: errands.length,
      errands,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch errands",
      error: error.message,
    });
  }
};

const getQuickErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.aggregate([
      {
        $match: {
          status: "open",
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $addFields: {
          priorityOrder: {
            $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0],
          },
        },
      },
      {
        $sort: {
          priorityOrder: -1,
          createdAt: -1,
        },
      },
    ]);

    res.status(200).json({
      message: "Quick errands fetched successfully",
      errands,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch quick errands",
      error: err.message,
    });
  }
};

const getActiveEmergencyErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.find({
      isEmergency: true,
      status: "open",
      emergencyExpiresAt: {
        $gt: new Date(),
      },
    })
      .populate("poster_id", "firstName lastName username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: errands,
    });
  } catch (error) {
    console.error("Get active emergency errands error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get emergency errands",
    });
  }
};

const getErrandById = async (req, res) => {
  const { id } = req.params;

  try {
    const errand = await ErrandModel.findById(id);
    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    res.status(200).json({ message: "Errand fetched successfully", errand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch errand", error: error.message });
  }
};

const deleteErrand = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedErrand = await ErrandModel.findByIdAndDelete(id);
    if (!deletedErrand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    res
      .status(200)
      .json({ message: "Errand deleted successfully", deletedErrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete errand", error: error.message });
  }
};

const editErrand = async (req, res) => {
  const { id } = req.params;
  const { title, description, budget, deadline, category, location, priority } =
    req.body;

  try {
    // validate ID before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid errand ID" });
    }
    const allowedUpdates = {
      title,
      description,
      budget,
      deadline,
      category,
      location,
      priority,
    };

    // remove undefined fields so they won’t overwrite existing values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(
        ([_, value]) => value !== undefined,
      ),
    );

    const updatedErrand = await ErrandModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        budget,
        deadline,
        category,
        location,
        priority,
      },
      { new: true, runValidators: true },
    );

    if (!updatedErrand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    res
      .status(200)
      .json({ message: "Errand updated successfully", errand: updatedErrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update errand", error: error.message });
  }
};

const assignErrand = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const erranzer_id = req.user.id;

    // ==========================================
    // FIND ERRAND
    // ==========================================

    const errand = await ErrandModel.findById(id).session(session);

    if (!errand) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // ==========================================
    // PREVENT DOUBLE ASSIGNMENT
    // ==========================================

    if (errand.erranzer_id) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Errand already assigned",
      });
    }

    // ==========================================
    // CHECK EMERGENCY EXPIRATION
    // ==========================================

    if (
      errand.isEmergency &&
      errand.emergencyExpiresAt &&
      new Date() > errand.emergencyExpiresAt
    ) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "This emergency errand has expired",
      });
    }

    // ==========================================
    // DETERMINE WHO PAYS
    // ==========================================
    //
    // Normal errand:
    //   bookedBy = null
    //   payer = poster_id
    //
    // Guardian booking:
    //   bookedBy = guardian
    //   payer = guardian
    //

    const payerId = errand.bookedBy || errand.poster_id;

    // ==========================================
    // FIND PAYER WALLET
    // ==========================================

    const wallet = await WalletModel.findOne({
      userId: payerId,
    }).session(session);

    // ==========================================
    // CALCULATE TOTAL AMOUNT
    // ==========================================

    const emergencySurcharge = Number(
      errand.emergencySurcharge || 0
    );

    const totalAmount =
      Number(errand.budget) +
      emergencySurcharge;

    // ==========================================
    // VALIDATE BALANCE
    // ==========================================

    if (!wallet || wallet.balance < totalAmount) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Payer has insufficient wallet balance",
      });
    }

    // ==========================================
    // HOLD FUNDS FOR ESCROW
    // ==========================================

    wallet.balance -= totalAmount;
    wallet.pending += totalAmount;

    await wallet.save({ session });

    // ==========================================
    // ASSIGN ERRAND
    // ==========================================

    errand.erranzer_id = erranzer_id;
    errand.status = "in_progress";

    await errand.save({ session });

    // ==========================================
    // COMMIT TRANSACTION
    // ==========================================

    await session.commitTransaction();
    session.endSession();

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    const posterUser =
      await UserModel.findById(errand.poster_id);

    const erranzerUser =
      await UserModel.findById(erranzer_id);

    if (!posterUser) {
      return res.status(404).json({
        error: "Poster not found",
      });
    }

    if (!erranzerUser) {
      return res.status(404).json({
        error: "Erranzer not found",
      });
    }

    // Notify the poster (senior if guardian booked it)
    if (posterUser.pushToken) {
      await sendPushNotification(
        posterUser.pushToken,
        TEMPLATES.ERRAND_ACCEPTED(
          `${erranzerUser.firstName} ${erranzerUser.lastName}`,
          errand.title
        ),
        {
          errandId: errand._id.toString(),
          type: "errand_accepted",
        }
      );
    }

    await sendNotification({
      recipientId: errand.poster_id,
      senderId: erranzer_id,
      errandId: errand._id,
      type: "errand_accepted",
      message: `Your errand "${errand.title}" has been assigned to an erranzer.`,
    });

    // ==========================================
    // ALSO NOTIFY GUARDIAN IF BOOKED ON BEHALF
    // ==========================================

    if (errand.bookedBy) {
      const guardianUser =
        await UserModel.findById(errand.bookedBy);

      if (guardianUser?.pushToken) {
        await sendPushNotification(
          guardianUser.pushToken,
          TEMPLATES.ERRAND_ACCEPTED(
            `${erranzerUser.firstName} ${erranzerUser.lastName}`,
            errand.title
          ),
          {
            errandId: errand._id.toString(),
            type: "errand_accepted",
          }
        );
      }

      await sendNotification({
        recipientId: errand.bookedBy,
        senderId: erranzer_id,
        errandId: errand._id,
        type: "errand_accepted",
        message: `The errand "${errand.title}" that you booked on behalf of a family member has been assigned to an erranzer.`,
      });
    }

    return res.status(200).json({
      message:
        "This errand has been assigned to you successfully",
      errand,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error(
      "Error assigning errand:",
      err
    );

    return res.status(500).json({
      message: "Failed to assign errand",
      error: err.message,
    });
  }
};

const markCompleted = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const userId = req.user.id;

    // ==========================================
    // FIND ERRAND
    // ==========================================

    const errand = await ErrandModel.findById(id).session(session);

    if (!errand) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // ==========================================
    // PREVENT DUPLICATE COMPLETION
    // ==========================================

    if (errand.status === "completed") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Errand already completed",
      });
    }

    // ==========================================
    // MAKE SURE ERRANZER EXISTS
    // ==========================================

    if (!errand.erranzer_id) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "This errand has not been assigned yet",
      });
    }

    // ==========================================
    // IDENTIFY USERS
    // ==========================================

    const posterId = errand.poster_id.toString();

    const erranzerId = errand.erranzer_id.toString();

    const currentUserId = userId.toString();


    const payerId = errand.bookedBy
      ? errand.bookedBy.toString()
      : posterId;


    // ==========================================
    // CHECK FAMILY GUARDIAN AUTHORIZATION
    // ==========================================

    let isGuardian = false;

    if (errand.bookedBy) {
      isGuardian =
        errand.bookedBy.toString() === currentUserId;

      if (isGuardian) {
        // Make sure the guardian is still linked
        // to the senior.

        const familyLink =
          await FamilyLinkModel.findOne({
            guardianId: errand.bookedBy,
            seniorId: errand.poster_id,
            status: "active",
          }).session(session);

      }
    }


    // ==========================================
    // DETERMINE WHO IS COMPLETING
    // ==========================================

    const isPoster =
      posterId === currentUserId;

    const isErranzer =
      erranzerId === currentUserId;

    /*
      For a family errand, the guardian should also
      be allowed to act on behalf of the senior.
    */

    const canActAsPoster =
      isPoster || isGuardian;


    // ==========================================
    // AUTHORIZATION
    // ==========================================

    if (!canActAsPoster && !isErranzer) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        message: "User not authorized",
      });
    }


    // ==========================================
    // MARK WHO COMPLETED
    // ==========================================

    if (canActAsPoster) {
      errand.posterCompleted = true;
    }

    if (isErranzer) {
      errand.erranzerCompleted = true;
    }


    // ==========================================
    // BOTH USERS COMPLETED
    // ==========================================

    if (
      errand.posterCompleted &&
      errand.erranzerCompleted
    ) {

      // ========================================
      // FIND PAYER WALLET
      // ========================================

      const payerWallet =
        await WalletModel.findOne({
          userId: payerId,
        }).session(session);

      // Erranzer wallet
      const erranzerWallet =
        await WalletModel.findOne({
          userId: errand.erranzer_id,
        }).session(session);


      if (!payerWallet || !erranzerWallet) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          message: "Wallet not found",
        });
      }


      // ========================================
      // CALCULATE TOTAL HELD AMOUNT
      // ========================================

      const budget =
        Number(errand.budget || 0);

      const emergencySurcharge =
        Number(
          errand.emergencySurcharge || 0
        );

      const totalHeld =
        budget + emergencySurcharge;


      // ========================================
      // VALIDATE PENDING BALANCE
      // ========================================

      if (
        payerWallet.pending < totalHeld
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          message:
            "Insufficient pending escrow balance",
        });
      }


      // ========================================
      // RELEASE ESCROW
      // ========================================

      payerWallet.pending -= totalHeld;


      // ========================================
      // PLATFORM FEE
      // ========================================

      /*
        Default platform fee = 10%

        If you later add:

        errand.platformFeeOverride

        you can use it here.
      */

      const platformFeeRate =
        errand.platformFeeOverride !== undefined &&
        errand.platformFeeOverride !== null
          ? Number(
              errand.platformFeeOverride
            )
          : 0.10;


      const platformFee =
        Number(
          (
            budget *
            platformFeeRate
          ).toFixed(2)
        );


      // ========================================
      // ERRANZER PAYOUT
      // ========================================

      const payout =
        Number(
          (budget - platformFee).toFixed(2)
        );


      // ========================================
      // VALIDATE PAYOUT
      // ========================================

      if (payout < 0) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          message:
            "Invalid platform fee configuration",
        });
      }


      // ========================================
      // CREDIT ERRANZER
      // ========================================

      erranzerWallet.balance += payout;


      // ========================================
      // SAVE WALLETS
      // ========================================

      await payerWallet.save({
        session,
      });

      await erranzerWallet.save({
        session,
      });


      // ========================================
      // RECORD PAYER TRANSACTION
      // ========================================

      await TransactionModel.create(
        [
          {
            userId: payerId,

            type: "escrow_release",

            amount: totalHeld,

            status: "completed",

            reference:
              `ERRAND-${errand._id}`,

            corporateAccountId:
              errand.corporateAccountId ||
              null,

            metadata: {
              errandId: errand._id,

              errandTitle:
                errand.title,

              releasedTo:
                errand.erranzer_id,

              posterId:
                errand.poster_id,

              bookedBy:
                errand.bookedBy || null,

              budget,

              emergencySurcharge,

              platformFee,
            },
          },
        ],
        {
          session,
        }
      );


      // ========================================
      // RECORD ERRANZER EARNING
      // ========================================

      await TransactionModel.create(
        [
          {
            userId:
              errand.erranzer_id,

            type: "earning",

            amount: payout,

            status: "completed",

            reference:
              `ERRAND-${errand._id}`,

            metadata: {
              errandId:
                errand._id,

              errandTitle:
                errand.title,

              platformFee,

              grossAmount:
                budget,

              emergencySurcharge,
            },
          },
        ],
        {
          session,
        }
      );


      // ========================================
      // MARK PAYMENT RELEASED
      // ========================================

      errand.paymentReleased = true;


      // ========================================
      // MARK ERRAND COMPLETED
      // ========================================

      errand.status = "completed";
    }


    // ==========================================
    // STOP LIVE TRACKING
    // ==========================================

    /*
      Once completion happens, the erranzer's
      location and ETA should no longer be active.
    */

    if (errand.status === "completed") {
      errand.erranzerLocation = undefined;
      errand.etaMinutes = null;
      errand.etaUpdatedAt = null;
    }


    // ==========================================
    // SAVE ERRAND
    // ==========================================

    await errand.save({
      session,
    });


    // ==========================================
    // COMMIT TRANSACTION
    // ==========================================

    await session.commitTransaction();

    session.endSession();


    // ==========================================
    // GET USERS FOR NOTIFICATIONS
    // ==========================================

    const posterUser =
      await UserModel.findById(
        errand.poster_id
      );

    const erranzerUser =
      await UserModel.findById(
        errand.erranzer_id
      );

    const guardianUser =
      errand.bookedBy
        ? await UserModel.findById(
            errand.bookedBy
          )
        : null;


    // ==========================================
    // BOTH COMPLETED
    // ==========================================

    if (
      errand.posterCompleted &&
      errand.erranzerCompleted
    ) {

      // Notify erranzer
      if (erranzerUser?.pushToken) {
        await sendPushNotification(
          erranzerUser.pushToken,

          TEMPLATES.ERRAND_COMPLETED_ERRANZER(
            errand.title
          ),

          {
            errandId:
              errand._id.toString(),

            type:
              "errand_completed",
          }
        );
      }


      // Notify senior/poster
      if (posterUser?.pushToken) {
        await sendPushNotification(
          posterUser.pushToken,

          TEMPLATES.ERRAND_COMPLETED_POSTER(
            errand.title
          ),

          {
            errandId:
              errand._id.toString(),

            type:
              "errand_completed",
          }
        );
      }


      // Notify guardian if different
      // from senior
      if (
        guardianUser &&
        guardianUser._id.toString() !==
          posterUser?._id.toString() &&
        guardianUser.pushToken
      ) {
        await sendPushNotification(
          guardianUser.pushToken,

          TEMPLATES.ERRAND_COMPLETED_POSTER(
            errand.title
          ),

          {
            errandId:
              errand._id.toString(),

            type:
              "errand_completed",
          }
        );
      }
    }


    // ==========================================
    // POSTER/GUARDIAN COMPLETED FIRST
    // ==========================================

    else if (
      canActAsPoster &&
      !errand.erranzerCompleted
    ) {

      if (erranzerUser?.pushToken) {
        await sendPushNotification(
          erranzerUser.pushToken,

          TEMPLATES.ERRAND_PRE_COMPLETED(
            errand.title,

            posterUser
              ? `${posterUser.firstName} ${posterUser.lastName}`
              : "The poster"
          ),

          {
            errandId:
              errand._id.toString(),

            type:
              "errand_pre_completed",
          }
        );
      }
    }


    // ==========================================
    // ERRANZER COMPLETED FIRST
    // ==========================================

    else if (
      isErranzer &&
      !errand.posterCompleted
    ) {

      if (posterUser?.pushToken) {
        await sendPushNotification(
          posterUser.pushToken,

          TEMPLATES.ERRAND_PRE_COMPLETED(
            errand.title,

            `${erranzerUser.firstName} ${erranzerUser.lastName}`
          ),

          {
            errandId:
              errand._id.toString(),

            type:
              "errand_pre_completed",
          }
        );
      }

      // Also notify guardian
      if (
        guardianUser &&
        guardianUser.pushToken
      ) {
        await sendPushNotification(
          guardianUser.pushToken,

          TEMPLATES.ERRAND_PRE_COMPLETED(
            errand.title,

            `${erranzerUser.firstName} ${erranzerUser.lastName}`
          ),

          {
            errandId:
              errand._id.toString(),

            type:
              "errand_pre_completed",
          }
        );
      }
    }


    // ==========================================
    // DATABASE NOTIFICATION
    // ==========================================

    if (
      errand.posterCompleted &&
      errand.erranzerCompleted
    ) {

      await sendNotification({
        recipientId:
          errand.poster_id,

        senderId:
          userId,

        errandId:
          errand._id,

        type:
          "errand_completed",

        message:
          `Your errand "${errand.title}" has been completed.`,
      });


      // Notify guardian too
      if (
        errand.bookedBy &&
        errand.bookedBy.toString() !==
          errand.poster_id.toString()
      ) {
        await sendNotification({
          recipientId:
            errand.bookedBy,

          senderId:
            userId,

          errandId:
            errand._id,

          type:
            "errand_completed",

          message:
            `The errand "${errand.title}" has been completed.`,
        });
      }
    }


    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        "Marked as completed successfully",

      errand,
    });

  } catch (err) {

    await session.abortTransaction();

    session.endSession();

    console.error(
      "Error Updating errand:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to complete errand",

      error:
        err.message,
    });
  }
};

module.exports = {
  postErrand,
  assignErrand,
  getAllErrands,
  getErrandById,
  getActiveEmergencyErrands,
  deleteErrand,
  editErrand,
  getQuickErrands,
  markCompleted,
};
