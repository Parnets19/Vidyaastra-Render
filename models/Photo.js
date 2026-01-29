const mongoose = require("mongoose")

const PhotoSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, "Please upload an image"],
  },
  caption: {
    type: String,
    maxlength: [200, "Caption cannot be more than 200 characters"],
  },
  album: {
    type: mongoose.Schema.ObjectId,
    ref: "Album",
    required: true,
  },
  uploadedAt: {
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

// Optional: Add a compound index for efficient querying and uniqueness if needed
PhotoSchema.index({ album: 1, image: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Photo", PhotoSchema)
