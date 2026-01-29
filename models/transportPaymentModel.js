const mongoose = require("mongoose")

const transportPaymentSchema = new mongoose.Schema(
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
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    // Payment plan details
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    numberOfInstallments: {
      type: Number,
      required: true,
      min: 1,
    },
    installmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment tracking
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Installment tracking
    installmentsPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingInstallments: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment history
    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "card", "upi", "net_banking", "cheque"],
          required: true,
        },
        transactionId: {
          type: String,
          trim: true,
        },
        installmentNumber: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "completed",
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],

    // Overall payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "completed", "overdue"],
      default: "pending",
    },

    // Payment plan start and end dates
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // Next due date
    nextDueDate: {
      type: Date,
    },

    // Academic year/session
    academicYear: {
      type: String,
      required: true,
    },

    // Additional information
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for payment completion percentage
transportPaymentSchema.virtual("completionPercentage").get(function () {
  return this.totalAmount > 0 ? Math.round((this.paidAmount / this.totalAmount) * 100) : 0
})

// Compound index for student, transport and school
transportPaymentSchema.index({ studentId: 1, transportId: 1, schoolId: 1 }, { unique: true })

// Index for payment status queries
transportPaymentSchema.index({ paymentStatus: 1, schoolId: 1 })

// Pre-save middleware to update remaining amounts and installments
transportPaymentSchema.pre("save", function (next) {
  this.remainingAmount = this.totalAmount - this.paidAmount
  this.remainingInstallments = this.numberOfInstallments - this.installmentsPaid

  // Update payment status based on amounts
  if (this.paidAmount === 0) {
    this.paymentStatus = "pending"
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "completed"
  } else {
    this.paymentStatus = "partial"
  }

  next()
})

module.exports = mongoose.model("TransportPayment", transportPaymentSchema)
