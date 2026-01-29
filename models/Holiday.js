const mongoose = require("mongoose")

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Holiday date is required"],
    },
    type: {
      type: String,
      required: [true, "Holiday type is required"],
      enum: ["National Holiday", "Festival", "Religious Holiday"],
    },
    description: {
      type: String,
      required: [true, "Holiday description is required"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    // MODIFIED: Add schoolId field
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true, // Make it required for new entries
    },
  },
  {
    timestamps: true,
  },
)

holidaySchema.index({ name: 1, year: 1, schoolId: 1 }, { unique: true }) // MODIFIED: Add schoolId to unique index

const Holiday = mongoose.model("Holiday", holidaySchema)

module.exports = Holiday
