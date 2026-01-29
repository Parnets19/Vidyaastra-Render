const mongoose = require("mongoose")

const issuedBookSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: "libraryBook" },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, // MODIFIED: Changed ref to 'Student'
  issueDate: Date,
  dueDate: Date,
  status: { type: String, enum: ["active", "overdue", "returned"], default: "active" }, // MODIFIED: Added 'returned' status
  actualReturnDate: { type: Date }, // MODIFIED: Added actual return date
  // MODIFIED: Add schoolId field
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
})

// Optional: Add a compound index for efficient querying and uniqueness if needed
issuedBookSchema.index(
  { book: 1, studentId: 1, schoolId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
) // Unique active issue per book per student per school

module.exports = mongoose.model("IssuedBook", issuedBookSchema)
