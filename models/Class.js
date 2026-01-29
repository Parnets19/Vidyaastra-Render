const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },

    // Instead of single studentId, better to keep an array of students
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    section: {
      type: String,
      trim: true,
    },

    // Reference to TeacherLogin for class teacher
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherLogin",
      default: null, // means no class teacher assigned yet
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness: className + section + schoolId
classSchema.index({ className: 1, section: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.models.Class || mongoose.model("Class", classSchema);
