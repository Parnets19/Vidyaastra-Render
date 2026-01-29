const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
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

// MODIFIED: Add compound index for name and schoolId
categorySchema.index({ name: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Category", categorySchema)
