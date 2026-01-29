const mongoose = require("mongoose")

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    numberOfInstallments: {
      type: Number,
      default: 1,
    },
    installments: [
      {
        amount: {
          type: Number,
          required: true,
        },
        paid: {
          type: Number,
          default: 0,
        },
        pending: {
          type: Number,
          default: function () {
            return this.amount
          },
        },
        dueDate: {
          type: Date,
          required: true,
        },
        paidDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["paid", "partial", "pending", "overdue"],
          default: "pending",
        },
        receiptNumber: {
          type: String,
          default: null,
        },
        paymentMethod: {
          type: String,
          default: null,
        },
      },
    ],
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

feeSchema.virtual("paid").get(function () {
  return this.installments.reduce((sum, inst) => sum + inst.paid, 0)
})

feeSchema.virtual("pending").get(function () {
  return this.installments.reduce((sum, inst) => sum + inst.pending, 0)
})

feeSchema.virtual("status").get(function () {
  const totalInstallments = this.installments.length
  if (totalInstallments === 0) return "pending"

  const paidInstallments = this.installments.filter((inst) => inst.status === "paid").length
  const pendingInstallments = this.installments.filter((inst) => inst.status === "pending").length
  const overdueInstallments = this.installments.filter((inst) => inst.status === "overdue").length

  if (paidInstallments === totalInstallments) {
    return "paid"
  } else if (paidInstallments > 0 || overdueInstallments > 0) {
    return "partial"
  } else {
    return "pending"
  }
})

feeSchema.index({ studentId: 1, schoolId: 1 })

module.exports = mongoose.model("Fee", feeSchema)
