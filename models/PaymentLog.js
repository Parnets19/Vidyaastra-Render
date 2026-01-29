const mongoose = require("mongoose");

const paymentLogSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    rawEmailData: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payerUpi: {
      type: String,
      required: true,
      trim: true,
    },
    matchedFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: false,
    },
    matchedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
    status: {
      type: String,
      enum: ["matched", "unmatched", "processing"],
      default: "processing",
    },
    emailSubject: {
      type: String,
      required: false,
    },
    emailFrom: {
      type: String,
      required: false,
    },
    emailDate: {
      type: Date,
      required: false,
    },
    processingNotes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
paymentLogSchema.index({ schoolId: 1, createdAt: -1 });
paymentLogSchema.index({ transactionId: 1 });
paymentLogSchema.index({ status: 1 });
paymentLogSchema.index({ matchedFeeId: 1 });

module.exports = mongoose.model("PaymentLog", paymentLogSchema);

