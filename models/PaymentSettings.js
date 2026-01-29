const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true, // Only one payment setting per school
    },
    upiId: {
      type: String,
      required: true,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Gmail OAuth credentials for email parsing
    gmailCredentials: {
      accessToken: {
        type: String,
        required: false,
      },
      refreshToken: {
        type: String,
        required: false,
      },
      tokenExpiry: {
        type: Date,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient querying
paymentSettingsSchema.index({ schoolId: 1 });
paymentSettingsSchema.index({ isActive: 1 });

module.exports = mongoose.model("PaymentSettings", paymentSettingsSchema);

