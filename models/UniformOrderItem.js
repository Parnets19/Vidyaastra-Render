const mongoose = require("mongoose")

const uniformOrderItemSchema = new mongoose.Schema({
  uniformItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UniformItem",
    required: true,
  },
  // REMOVED: size field (no longer needed)
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  priceAtOrder: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
})

// MODIFIED: Updated index without size
uniformOrderItemSchema.index({ uniformItem: 1, schoolId: 1 })

// Check if model already exists before creating it
const UniformOrderItem = mongoose.models.UniformOrderItem || mongoose.model("UniformOrderItem", uniformOrderItemSchema)
module.exports = UniformOrderItem
