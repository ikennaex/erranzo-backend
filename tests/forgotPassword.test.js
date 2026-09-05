const { test, describe, mock } = require("node:test");
const assert = require("node:assert");

// Mock dependencies before importing controller
const UserModel = require("../models/User");
const { forgotPassword } = require("../controllers/forgotPasswordController");

describe("forgotPasswordController - User Enumeration Prevention", () => {
  const NEUTRAL_MESSAGE = "If an account exists for this email, we've sent a password reset link.";

  test("returns 200 with neutral message when user exists and saves reset token", async () => {
    let saved = false;
    const mockUser = {
      email: "user@example.com",
      save: async () => {
        saved = true;
      },
    };

    // Mock UserModel.findOne to return user
    const originalFindOne = UserModel.findOne;
    UserModel.findOne = async () => mockUser;

    const req = {
      body: { email: "user@example.com" },
    };

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    try {
      await forgotPassword(req, res);

      assert.strictEqual(responseStatus, 200);
      assert.deepStrictEqual(responseBody, { message: NEUTRAL_MESSAGE });
      assert.strictEqual(saved, true);
      assert.ok(mockUser.resetPasswordToken);
      assert.ok(mockUser.resetPasswordExpires);
    } finally {
      UserModel.findOne = originalFindOne;
    }
  });

  test("returns 200 with identical status and neutral message when user does NOT exist", async () => {
    // Mock UserModel.findOne to return null
    const originalFindOne = UserModel.findOne;
    UserModel.findOne = async () => null;

    const req = {
      body: { email: "nonexistent@example.com" },
    };

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    try {
      await forgotPassword(req, res);

      // Status and message must be 100% identical to the existing user case
      assert.strictEqual(responseStatus, 200);
      assert.deepStrictEqual(responseBody, { message: NEUTRAL_MESSAGE });
    } finally {
      UserModel.findOne = originalFindOne;
    }
  });
});
