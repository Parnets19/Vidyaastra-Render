const mongoose = require("mongoose")

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Email should be unique globally, not per school
  },
  phone: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: "",
  },
  classes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ],
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  userID: {
    type: String,
    unique: true, // UserID should be unique globally, not per school
    default: () => {
      // Generate a unique ID if not provided
      return "TCH-" + Math.random().toString(36).substr(2, 9)
    },
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

// Add text index for searching
teacherSchema.index({ name: "text", subject: "text" })

// MODIFIED: Add compound index for email and schoolId for uniqueness within a school
teacherSchema.index({ email: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Teacher", teacherSchema)
