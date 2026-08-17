const crypto = require("crypto");
const PDFDocument = require("pdfkit");

const UserModel = require("../../models/User");
const CorporateAccountModel = require("../../models/CorporateAccount");
const CorporateEmployeeModel = require("../../models/CorporateEmployee");
const WalletModel = require("../../models/Wallet");
const sendCorporateInvitationMail = require("../../utils/emails/coporateInvitationEmail");
const ErrandModel = require("../../models/Errand");
const TransactionModel = require("../../models/Transaction");

const registerCorporateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { companyName, companyEmail, billingEmail, monthlySpendingLimit } =
      req.body;

    if (!companyName || !companyEmail || !billingEmail) {
      return res.status(400).json({
        message: "companyName, companyEmail and billingEmail are required",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // One corporate account per user
    if (user.corporateAccountId) {
      return res.status(400).json({
        message: "You already belong to a corporate account",
      });
    }

    const corporateAccount = await CorporateAccountModel.create({
      companyName,
      companyEmail,
      billingEmail,
      adminUserId: userId,
      monthlySpendingLimit: monthlySpendingLimit || null,
      status: "active",
    });

    // Create corporate employee record
    await CorporateEmployeeModel.create({
      corporateAccountId: corporateAccount._id,
      userId,
      role: "admin",
      status: "active",
    });

    // Link user to company
    user.corporateAccountId = corporateAccount._id;

    await user.save();

    // Create corporate wallet
    await WalletModel.create({
      corporateAccountId: corporateAccount._id,
      type: "corporate",
      balance: 0,
      pending: 0,
    });

    return res.status(201).json({
      message: "Corporate account created successfully",

      corporateAccount,
    });
  } catch (error) {
    console.error("Register corporate account error:", error);

    return res.status(500).json({
      message: "Failed to register corporate account",
      error: error.message,
    });
  }
};

const corporateEmployeeInvitation = async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");

    await CorporateEmployeeModel.create({
      corporateAccountId: req.corporateAccount._id,

      userId: existingUser._id,

      role: "employee",

      status: "invited",

      inviteToken: token,

      inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    await sendCorporateInvitationMail({
      email: existingUser.email,
      firstName: existingUser.firstName,
      companyName: req.corporateAccount.companyName,
      role: employee.role,
      token: employee.inviteToken,
      inviteExpiresAt: employee.inviteExpiresAt,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to register corporate account",
      error: err.message,
    });
  }
};

const acceptCorporateInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const employee = await CorporateEmployeeModel.findOne({
      inviteToken: token,
      status: "invited",
      inviteExpiresAt: {
        $gt: new Date(),
      },
    });

    if (!employee) {
      return res.status(400).json({
        message: "Invalid or expired invitation",
      });
    }

    // Invitation belongs to this logged-in user
    if (employee.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "This invitation does not belong to this user",
      });
    }

    employee.status = "active";
    employee.inviteToken = null;
    employee.inviteExpiresAt = null;

    await employee.save();

    const user = await UserModel.findById(req.user.id);

    user.corporateAccountId = employee.corporateAccountId;

    await user.save();

    return res.status(200).json({
      message: "Corporate invitation accepted",
      employee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to accept invitation",
      error: error.message,
    });
  }
};

// for corperate admin
const getCorporateErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.find({
      corporateAccountId: req.corporateAccount._id,
    })
      .populate("corporateEmployeeId", "userId role")
      .populate("poster_id", "firstName lastName email")
      .sort({
        createdAt: -1,
      });
    return res.status(200).json({ errands });
  } catch (err) {
    console.error("Error fetching corporate errands:", err);
    return res.status(500).json({
      message: "Failed to fetch corporate errands",
      error: err.message,
    });
  }
};

const getCorporateAnalytics = async (req, res) => {
  try {
    const analytics = await ErrandModel.aggregate([
      {
        $match: {
          corporateAccountId: req.corporateAccount._id,

          status: "completed",
        },
      },

      {
        $group: {
          _id: "$corporateEmployeeId",

          totalSpend: {
            $sum: "$budget",
          },

          errands: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          totalSpend: -1,
        },
      },
    ]);
    return res.status(200).json({ analytics });
  } catch (err) {
    console.error("Error fetching corporate analytics:", err);
    return res.status(500).json({
      message: "Failed to fetch corporate analytics",
      error: err.message,
    });
  }
};

const getCorporateAccount = async (req, res) => {
  try {
    const corporateAccount = await CorporateAccountModel.findById(req.corporateAccount._id);

    if (!corporateAccount) {
      return res.status(404).json({
        message: "Corporate account not found",
      });
    }
    return res.status(200).json({ corporateAccount });
  } catch (err) {
    console.error("Error fetching corporate account:", err);
    return res.status(500).json({
      message: "Failed to fetch corporate account",
      error: err.message,
    });
  }
}

const getCorporateEmployees = async (req, res) => {
  try {
    const employees = await CorporateEmployeeModel.find({
      corporateAccountId: req.corporateAccount._id,
    })
      .populate("userId", "firstName lastName email")
      .sort({
        createdAt: -1,
      });
    return res.status(200).json({ employees });
  } catch (err) {
    console.error("Error fetching corporate employees:", err);
    return res.status(500).json({
      message: "Failed to fetch corporate employees",
      error: err.message,
    });
  }
}

const updateCorporateEmployee = async (req, res) =>  {
  try {
    const { employeeId } = req.params;

    const { role } = req.body;

    const employee = await CorporateEmployeeModel.findOneAndUpdate(
      {
        _id: employeeId,
        corporateAccountId: req.corporateAccount._id,
      },
      { role },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        message: "Corporate employee not found",
      });
    }
  } catch (err) {
    console.error("Error updating corporate employee:", err);
    return res.status(500).json({
      message: "Failed to update corporate employee",
      error: err.message,
    });
  }
}

const removeCorporateEmployee = async (req, res) => {
  try{
    const { employeeId } = req.params;
    const employee = await CorporateEmployeeModel.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Corporate employee not found",
      });
    }

    if (employee.corporateAccountId.toString() !== req.corporateAccount._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to remove this employee",
      });
    }

  } catch (err) {
    console.error("Error removing corporate employee:", err);
    return res.status(500).json({
      message: "Failed to remove corporate employee",
      error: err.message,
    });
  }
}

const updateCorporateAccount = async (req, res) => {
  try {
    const { companyName, companyEmail, billingEmail, monthlySpendingLimit } = req.body;

    const corporateAccount = await CorporateAccountModel.findByIdAndUpdate(
      req.corporateAccount._id,
      {
        companyName,
        companyEmail,
        billingEmail,
        monthlySpendingLimit,
      },
      { new: true }
    );
    return res.status(200).json({ corporateAccount });
  } catch (err) {
    console.error("Error updating corporate account:", err);
    return res.status(500).json({
      message: "Failed to update corporate account",
      error: err.message,
    });
  }
}

const getCorporateInvoices = async (req, res) => {
  try {
    const invoices = await TransactionModel.find({
      corporateAccountId: req.corporateAccount._id,
    }).sort({ createdAt: -1 });
    return res.status(200).json({ invoices });
  } catch (err) {
    console.error("Error fetching corporate invoices:", err);
    return res.status(500).json({
      message: "Failed to fetch corporate invoices",
      error: err.message,
    });
  }
}


const downloadCorporateInvoicePdf = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // ==========================================
    // FIND INVOICE
    // ==========================================
    const invoice = await TransactionModel.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // ==========================================
    // CHECK CORPORATE ACCOUNT OWNERSHIP
    // ==========================================
    if (
      !invoice.corporateAccountId ||
      invoice.corporateAccountId.toString() !==
        req.corporateAccount._id.toString()
    ) {
      return res.status(403).json({
        message: "You do not have permission to download this invoice",
      });
    }

    // ==========================================
    // CREATE PDF
    // ==========================================
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // ==========================================
    // RESPONSE HEADERS
    // ==========================================
    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice._id}.pdf"`
    );

    // Send PDF directly to browser
    doc.pipe(res);

    // ==========================================
    // COMPANY INFORMATION
    // ==========================================
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("ERRANZO", 50, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Corporate Services", 50, 78);

    // ==========================================
    // INVOICE TITLE
    // ==========================================
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 50, {
        align: "right",
      });

    // ==========================================
    // INVOICE DETAILS
    // ==========================================
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Invoice ID: ${invoice._id}`,
        350,
        90,
        {
          align: "right",
        }
      );

    doc.text(
      `Date: ${new Date(invoice.createdAt).toLocaleDateString(
        "en-NG"
      )}`,
      350,
      105,
      {
        align: "right",
      }
    );

    // ==========================================
    // LINE
    // ==========================================
    doc
      .moveTo(50, 140)
      .lineTo(545, 140)
      .stroke();

    // ==========================================
    // BILL TO
    // ==========================================
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Billed To", 50, 165);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        req.corporateAccount.name ||
          req.corporateAccount.companyName ||
          "Corporate Account",
        50,
        185
      );

    if (req.corporateAccount.email) {
      doc.text(
        req.corporateAccount.email,
        50,
        200
      );
    }

    // ==========================================
    // TRANSACTION DETAILS
    // ==========================================
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Transaction Details", 50, 245);

    // Table header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Description", 50, 275);

    doc.text("Amount", 430, 275, {
      width: 100,
      align: "right",
    });

    doc
      .moveTo(50, 292)
      .lineTo(545, 292)
      .stroke();

    // ==========================================
    // TRANSACTION DESCRIPTION
    // ==========================================
    const description =
      invoice.description ||
      invoice.title ||
      invoice.type ||
      "Corporate Transaction";

    const amount = Number(invoice.amount || 0);

    doc
      .font("Helvetica")
      .text(description, 50, 310, {
        width: 350,
      });

    doc.text(
      `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      400,
      310,
      {
        width: 145,
        align: "right",
      }
    );

    // ==========================================
    // TOTAL
    // ==========================================
    doc
      .moveTo(50, 355)
      .lineTo(545, 355)
      .stroke();

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total", 350, 375);

    doc.text(
      `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      400,
      375,
      {
        width: 145,
        align: "right",
      }
    );

    // ==========================================
    // STATUS
    // ==========================================
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Status: ${invoice.status || "Paid"}`,
        50,
        425
      );

    // ==========================================
    // FOOTER
    // ==========================================
    doc
      .fontSize(9)
      .fillColor("gray")
      .text(
        "Thank you for using Erranzo.",
        50,
        750,
        {
          align: "center",
          width: 495,
        }
      );

    // ==========================================
    // FINISH PDF
    // ==========================================
    doc.end();
  } catch (err) {
    console.error(
      "Error downloading corporate invoice PDF:",
      err
    );

    // Only send JSON if headers haven't already been sent
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to download corporate invoice PDF",
        error: err.message,
      });
    }

    res.end();
  }
};


module.exports = {
  registerCorporateAccount,
  corporateEmployeeInvitation,
  acceptCorporateInvitation,
  getCorporateErrands,
  getCorporateAnalytics,
  getCorporateAccount,
  getCorporateEmployees,
  updateCorporateEmployee,
  removeCorporateEmployee,
  updateCorporateAccount,
  getCorporateInvoices,
  downloadCorporateInvoicePdf

};
