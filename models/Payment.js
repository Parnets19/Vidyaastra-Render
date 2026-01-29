// models/Payment.js
const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School", // Reference to User model (assumed from SuperAdminLogin)
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi"],
      required: true,
    },
    cardDetails: {
      cardNumber: { type: String },
      nameOnCard: { type: String },
      expiryDate: { type: String },
      cvv: { type: String },
    },
    upiId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
)

// Optional: Add a compound index for efficient querying
paymentSchema.index({ schoolId: 1, packageId: 1, createdAt: -1 })

module.exports = mongoose.model("Payment", paymentSchema)
