// models/Notification.js
const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // Reference to your Student model
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String, // e.g., 'fee', 'assignment', 'exam', 'announcement', 'event', 'general'
      default: "general",
      enum: ["fee", "assignment", "exam", "library", "meeting", "announcement", "event", "general"], // Optional: restrict types
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Optional: Add an expiry date for notifications
    expiresAt: {
      type: Date,
      // Example: Notifications expire after 30 days
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    // MODIFIED: Add schoolId field
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt fields
  },
)

// Index for efficient querying by student, schoolId and createdAt
notificationSchema.index({ student: 1, schoolId: 1, createdAt: -1 })

// Optional: Add a TTL (Time-To-Live) index for automatic deletion of expired notifications
// This requires MongoDB version 2.2+
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model("Notification", notificationSchema)
