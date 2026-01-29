const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    examType: {
      type: String,
      // enum: ["Midterm", "Final", "Unit Test", "Quiz", "Practical", "Other"],
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },

    // ✅ Array of subjects for this exam timetable
    subjects: [
      {
        subjectName: { type: String, required: true },
        date: { type: String, required: true }, // keep as string or switch to Date type
        startTime: { type: String, required: true }, // e.g. "09:00"
        endTime: { type: String, required: true }, // e.g. "11:30"
        duration: { type: String }, // auto-calculated
        syllabus: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Compound index: ensure a class can’t have duplicate examType for same school
examSchema.index({ schoolId: 1, classId: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model("Exam", examSchema);
