const mongoose = require("mongoose")

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    students: { type: Number, required: true },
    price: { type: Number, required: true },
    duration: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      required: true,
    },
    features: [{ type: String, required: true }],
    color: { type: String, default: "blue" },
    // MODIFIED: Add schoolId field
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  { timestamps: true },
)

// MODIFIED: Add compound index for name and schoolId
packageSchema.index({ name: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Package", packageSchema)
