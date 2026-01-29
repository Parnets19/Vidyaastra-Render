const mongoose = require("mongoose")

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  // MODIFIED: Changed 'category' to 'classId'
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class", // Reference the Class model
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// MODIFIED: Add compound index for title, author and schoolId, and classId
bookSchema.index({ title: 1, author: 1, classId: 1, schoolId: 1 }, { unique: true })

module.exports = mongoose.model("Book", bookSchema)
