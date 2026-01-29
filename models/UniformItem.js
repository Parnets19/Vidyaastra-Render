const mongoose = require("mongoose")

const uniformItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  // MODIFIED: Add classId reference
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },

  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
})

// Update updatedAt before saving
uniformItemSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// MODIFIED: Add compound index for name, classId and schoolId
uniformItemSchema.index({ name: 1, classId: 1, schoolId: 1 }, { unique: true })

// Check if model already exists before creating it
const UniformItem = mongoose.models.UniformItem || mongoose.model("UniformItem", uniformItemSchema)
module.exports = UniformItem
