const mongoose = require("mongoose")

const assignmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  status: {
    type: String,
    enum: ["pending", "submitted", "graded", "late"],
    default: "pending",
  },
  priority: {
    type: String,
    default: "medium",
  },
  submittedDate: {
    type: Date,
  },
  grade: {
    type: String,
  },
  teacherComments: {
    type: String,
  },
  className: {
    type: String,
  },
  section: {
    type: String,
  },

  attachments: [
    {
      url: {
        type: String,
      },
      name: {
        type: String,
      },
      type: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
    },
  ],
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

// Update the updatedAt field before saving
assignmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Optional: Add a compound index for efficient querying and uniqueness if needed
// For example, to ensure an assignment title is unique per student per school per due date
assignmentSchema.index({ studentId: 1, title: 1, dueDate: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Assignment", assignmentSchema)
