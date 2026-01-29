const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ["Sports", "Academics", "Cultural", "Meeting", "Other"],
      required: true,
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
eventSchema.index({ title: 1, date: 1, time: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Event", eventSchema)
