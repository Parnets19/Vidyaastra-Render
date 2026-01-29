const mongoose = require("mongoose")

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: Date,
    },
    status: {
      type: String,
    },
    className: {
      type: String,
    },
    section: {  
      type: String,
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
// For example, to ensure a student's attendance is unique per day per school
attendanceSchema.index({ studentId: 1, date: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Attendance", attendanceSchema)
