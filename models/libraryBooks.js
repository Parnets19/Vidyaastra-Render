const mongoose = require("mongoose")

const librarybookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true, // ISBN should be unique globally, not per school
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Fiction", "Non-Fiction", "Science", "History", "Technology"],
    },
    totalCopies: {
      type: Number,
      required: [true, "Total copies is required"],
      min: [1, "At least 1 copy must exist"],
    },
    availableCopies: {
      type: Number,
      required: [true, "Available copies is required"],
      validate: {
        validator: function (value) {
          return value <= this.totalCopies // Ensure available <= total
        },
        message: "Available copies cannot exceed total copies",
      },
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

// Pre-save hook to validate availableCopies
librarybookSchema.pre("save", function (next) {
  if (this.availableCopies > this.totalCopies) {
    throw new Error("Available copies cannot exceed total copies")
  }
  next()
})

// Optional: Add a compound index for efficient querying (title/author unique per school)
librarybookSchema.index({ title: 1, author: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("libraryBook", librarybookSchema)
