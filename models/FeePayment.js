const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true,
    },
    installmentIndex: {
      type: Number,
      required: true, // Index of the installment in the fee's installments array
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
      required: false,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash", "cheque"],
      default: "upi",
    },
    paidDate: {
      type: Date,
      required: false,
    },
    upiReferenceId: {
      type: String,
      required: false,
      trim: true,
    },
    payerUpiId: {
      type: String,
      required: false,
      trim: true,
    },
    receiptNumber: {
      type: String,
      required: false,
      trim: true,
    },
    notes: {
      type: String,
      required: false,
    },
    // For tracking payment attempts
    paymentAttempts: [{
      attemptDate: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["initiated", "completed", "failed"],
        required: true,
      },
      transactionId: {
        type: String,
        required: false,
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
feePaymentSchema.index({ studentId: 1, schoolId: 1 });
feePaymentSchema.index({ feeId: 1 });
feePaymentSchema.index({ status: 1 });
feePaymentSchema.index({ transactionId: 1 });
feePaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FeePayment", feePaymentSchema);

