const mongoose = require("mongoose");

const timeTableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  timetable: [
    {
      className: {
        type: String,
        required: true,
      },
      timetableName: {
        type: String, // e.g. "Morning Schedule", "Afternoon Schedule"
        required: true,
      },
      day: {
        type: String, // e.g. "Monday", "Tuesday"
        required: true,
      },
      periods: [
        {
          subjectName: String,
          teacherName: String,
          startTime: String,
          endTime: String,
        },
      ],
    },
    { timestamps: true },
  ],
});

module.exports = mongoose.model("TimeTable", timeTableSchema);
