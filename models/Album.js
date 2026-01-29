const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  date: {
    type: Date,
  },
  images: [
    {
      filename: String,
      path: String,
      size: Number,
      mimetype: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // MODIFIED: Add schoolId field
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
});

// Optional: Add a compound index for efficient querying and uniqueness if needed
// For example, to ensure an album title is unique per school per date
albumSchema.index({ title: 1, date: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model("Album", albumSchema);
