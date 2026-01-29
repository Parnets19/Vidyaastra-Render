// Updated Birthday model with classId
const mongoose = require("mongoose")

const birthdaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
    default: "#667eea",
  },
  type: {
    type: String,
    enum: ["upcoming", "past"],
    required: true,
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
  // NEW: Add classId field
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
})

// Updated compound index to include classId
birthdaySchema.index({ name: 1, role: 1, date: 1, schoolId: 1, classId: 1 }, { unique: true })

module.exports = mongoose.model("Birthday", birthdaySchema)
