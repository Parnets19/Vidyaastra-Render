const PaymentSettings = require("../models/PaymentSettings");
const upload = require("../utils/multer");
const path = require("path");
const fs = require("fs");

// ✅ Create or update payment settings
exports.createOrUpdatePaymentSettings = async (req, res) => {
  try {
    const { schoolId, upiId } = req.body;

    if (!schoolId || !upiId) {
      return res.status(400).json({
        success: false,
        message: "School ID and UPI ID are required",
      });
    }

    // Validate UPI ID format (basic validation)
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiIdRegex.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid UPI ID format",
      });
    }

    let qrCodeUrl = "";

    // Handle QR code upload if provided
    if (req.file) {
      qrCodeUrl = `/uploads/payment-qr/${req.file.filename}`;
    }

    // Check if payment settings already exist for this school
    let paymentSettings = await PaymentSettings.findOne({ schoolId });

    if (paymentSettings) {
      // Update existing settings
      paymentSettings.upiId = upiId;
      if (qrCodeUrl) {
        // Delete old QR code file if exists
        if (paymentSettings.qrCodeUrl) {
          const oldFilePath = path.join(__dirname, "..", paymentSettings.qrCodeUrl);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        paymentSettings.qrCodeUrl = qrCodeUrl;
      }
      await paymentSettings.save();
    } else {
      // Create new settings
      if (!qrCodeUrl) {
        return res.status(400).json({
          success: false,
          message: "QR code is required for new payment settings",
        });
      }

      paymentSettings = new PaymentSettings({
        schoolId,
        upiId,
        qrCodeUrl,
        isActive: true,
      });
      await paymentSettings.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment settings saved successfully",
      data: paymentSettings,
    });
  } catch (error) {
    console.error("Error in createOrUpdatePaymentSettings:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get payment settings for a school
exports.getPaymentSettings = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const paymentSettings = await PaymentSettings.findOne({ schoolId });

    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: "Payment settings not found for this school",
      });
    }

    res.status(200).json({
      success: true,
      data: paymentSettings,
    });
  } catch (error) {
    console.error("Error in getPaymentSettings:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Update Gmail credentials for email parsing
exports.updateGmailCredentials = async (req, res) => {
  try {
    const { schoolId, accessToken, refreshToken, tokenExpiry, email } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const paymentSettings = await PaymentSettings.findOne({ schoolId });

    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: "Payment settings not found for this school",
      });
    }

    paymentSettings.gmailCredentials = {
      accessToken,
      refreshToken,
      tokenExpiry: new Date(tokenExpiry),
      email,
    };

    await paymentSettings.save();

    res.status(200).json({
      success: true,
      message: "Gmail credentials updated successfully",
      data: paymentSettings.gmailCredentials,
    });
  } catch (error) {
    console.error("Error in updateGmailCredentials:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Delete payment settings
exports.deletePaymentSettings = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const paymentSettings = await PaymentSettings.findOneAndDelete({ schoolId });

    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: "Payment settings not found for this school",
      });
    }

    // Delete QR code file if exists
    if (paymentSettings.qrCodeUrl) {
      const filePath = path.join(__dirname, "..", paymentSettings.qrCodeUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment settings deleted successfully",
    });
  } catch (error) {
    console.error("Error in deletePaymentSettings:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

