const mongoose = require("mongoose")

const uniformOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student", // Assuming 'User' here refers to 'Student' based on previous context
    required: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniformOrderItem",
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["Credit Card", "Debit Card", "UPI", "Net Banking", "Cash on Delivery"],
  },
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // MODIFIED: Add schoolId field
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
})

uniformOrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// MODIFIED: Add compound index for user, createdAt and schoolId
uniformOrderSchema.index({ user: 1, createdAt: -1, schoolId: 1 })

// ✅ FIX: Add model overwrite protection
const UniformOrder = mongoose.models.UniformOrder || mongoose.model("UniformOrder", uniformOrderSchema)
module.exports = UniformOrder
