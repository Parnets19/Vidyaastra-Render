const express = require("express");
const router = express.Router();
const paymentSettingsController = require("../controllers/paymentSettingsController");
const feePaymentController = require("../controllers/feePaymentController");
const paymentVerificationController = require("../controllers/paymentVerificationController");
const GmailOAuthService = require("../services/gmailOAuthService");
const upload = require("../utils/multer");

const gmailOAuthService = new GmailOAuthService();

// Payment Settings Routes
router.post(
  "/settings",
  upload.single("qrCode"),
  paymentSettingsController.createOrUpdatePaymentSettings
);

router.get("/settings", paymentSettingsController.getPaymentSettings);

router.put("/settings/gmail", paymentSettingsController.updateGmailCredentials);

router.delete("/settings", paymentSettingsController.deletePaymentSettings);

// Fee Payment Routes
router.post("/fees/initiate", feePaymentController.initiateFeePayment);

router.get("/fees/student", feePaymentController.getStudentFeePayments);

router.get("/fees/status/:paymentId", feePaymentController.getPaymentStatus);

router.put("/fees/status/:paymentId", feePaymentController.updatePaymentStatus);

router.get("/fees/pending", feePaymentController.getPendingPayments);

// Payment Verification Routes
router.post("/verify", paymentVerificationController.processPaymentVerification);

router.get("/logs", paymentVerificationController.getPaymentLogs);

router.post("/verify/manual", paymentVerificationController.triggerManualVerification);

router.get("/statistics", paymentVerificationController.getPaymentStatistics);

// Gmail OAuth Routes
router.get("/oauth/url", (req, res) => {
  try {
    const { schoolId } = req.query;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const { authUrl, state } = gmailOAuthService.generateAuthUrl(schoolId);
    
    res.status(200).json({
      success: true,
      authUrl,
      state,
    });
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    res.status(500).json({
      success: false,
      message: "Error generating OAuth URL",
      error: error.message,
    });
  }
});

router.get("/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Authorization code and state are required",
      });
    }

    const [schoolId, stateToken] = state.split(':');
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "Invalid state parameter",
      });
    }

    // Exchange code for tokens
    const tokens = await gmailOAuthService.getTokensFromCode(code);
    
    // Update payment settings with Gmail credentials
    const PaymentSettings = require("../models/PaymentSettings");
    const paymentSettings = await PaymentSettings.findOne({ schoolId });
    
    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: "Payment settings not found for this school",
      });
    }

    paymentSettings.gmailCredentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(tokens.expiry_date),
      email: tokens.scope?.includes('email') ? 'configured' : null,
    };

    await paymentSettings.save();

    res.status(200).json({
      success: true,
      message: "Gmail credentials configured successfully",
      data: {
        schoolId,
        emailConfigured: true,
      },
    });
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    res.status(500).json({
      success: false,
      message: "Error processing OAuth callback",
      error: error.message,
    });
  }
});

module.exports = router;
