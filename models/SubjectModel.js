// models/Subject.js
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    SubjectName: {
      type: String,
      required: true,
      trim: true,
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School", // reference to School
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // if you want to track who created it
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
