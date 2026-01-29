const mongoose = require("mongoose")

// Transport Request Schema for student requests
const transportRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    transportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      required: true,
    },
    pickupStopId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    dropoffStopId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    requestStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    monthlyFee: {
      type: Number,
      required: true,
    },
    paymentPlan: {
      type: String,
      enum: ["monthly", "quarterly", "half-yearly", "yearly"],
      default: "monthly",
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Updated index to allow multiple requests per student-transport combination if they have different statuses
transportRequestSchema.index({ studentId: 1, transportId: 1, requestStatus: 1 })
transportRequestSchema.index({ schoolId: 1, requestStatus: 1 })

module.exports = mongoose.model("TransportRequest", transportRequestSchema)
