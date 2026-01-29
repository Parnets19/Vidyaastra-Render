const mongoose = require("mongoose");

const teacherLoginSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
    },
    profilePic: {
      type: String,
      default: "",
    },
    subjects: [
      {
        type: String,
      },
    ],
    classes: [
      {
        type: String,
      },
    ],
    classSubjects: [
      {
        className: {
          type: String,
          required: true,
        },
        subjects: [
          {
            type: String,
            required: true,
          },
        ],
      },
    ],
    classTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeacherLogin", teacherLoginSchema);