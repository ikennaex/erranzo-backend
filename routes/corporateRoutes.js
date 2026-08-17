const express = require("express");

const router = express.Router();

const {
  registerCorporateAccount,
  getCorporateAccount,
  updateCorporateAccount,
  corporateEmployeeInvitation,
  acceptCorporateInvitation,
  getCorporateEmployees,
  updateCorporateEmployee,
  removeCorporateEmployee,
  getCorporateErrands,
  getCorporateAnalytics,
  getCorporateInvoices,
  downloadCorporateInvoicePdf,
} = require("../controllers/corporate/corporateController");
const { authToken, corporateAuth } = require("../middleware/auth");



// Register
router.post("/register", authToken, registerCorporateAccount);

// Accept invitation
router.post("/employees/accept/:token", authToken, acceptCorporateInvitation);

// Account
router.get(
  "/account",
  authToken,
  corporateAuth(["admin"]),
  getCorporateAccount,
);

router.patch(
  "/account",
  authToken,
  corporateAuth(["admin"]),
  updateCorporateAccount,
);

// Employees
router.post(
  "/employees/invite",
  authToken,
  corporateAuth(["admin"]),
  corporateEmployeeInvitation,
);

router.get(
  "/employees",
  authToken,
  corporateAuth(["admin", "manager"]),
  getCorporateEmployees,
);

router.patch(
  "/employees/:id",
  authToken,
  corporateAuth(["admin"]),
  updateCorporateEmployee,
);

router.delete(
  "/employees/:id",
  authToken,
  corporateAuth(["admin"]),
  removeCorporateEmployee,
);

// Errands
router.get(
  "/errands",
  authToken,
  corporateAuth(["admin", "manager"]),
  getCorporateErrands,
);

// Analytics
router.get(
  "/analytics",
  authToken,
  corporateAuth(["admin"]),
  getCorporateAnalytics,
);

// Invoices
router.get(
  "/invoices",
  authToken,
  corporateAuth(["admin"]),
  getCorporateInvoices,
);

router.get(
  "/invoices/:id/pdf",
  authToken,
  corporateAuth(["admin"]),
  downloadCorporateInvoicePdf,
);

module.exports = router;
