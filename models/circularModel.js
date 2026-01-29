const mongoose = require("mongoose")

const circularSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
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
// For example, to ensure a circular title is unique per school per date
circularSchema.index({ title: 1, date: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Circular", circularSchema)
