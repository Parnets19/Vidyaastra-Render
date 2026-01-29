const mongoose = require("mongoose")

const diarySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Personal", "Academics", "Other"],
      default: "Other",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // MODIFIED: Add schoolId field
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  { timestamps: true },
)

// Optional: Add a compound index for efficient querying and uniqueness if needed
diarySchema.index({ student: 1, title: 1, date: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Diary", diarySchema)
