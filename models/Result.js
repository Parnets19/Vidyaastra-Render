const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    results: [
      {
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
          required: true,
        },
        examType: {
          type: String,
          // enum: ["Midterm", "Final", "Unit Test", "Quiz", "Practical", "Other"],
          required: true,
        },
        examName: {
          type: String,
          required: false, // Optional: e.g., "Mathematics Midterm 1", "Physics Unit Test 2"
        },
        subjects: [
          {
            subjectName: { type: String, required: true },
            maxMarks: { type: Number, required: true, min: 0 },
            scoredMarks: { 
              type: Number, 
              required: true, 
              min: 0,
              validate: {
                validator: function(value) {
                  return value <= this.maxMarks;
                },
                message: 'Scored marks cannot exceed maximum marks'
              }
            },
            grade: { type: String, required: true },
          },
        ],
        totalMaxMarks: { type: Number, default: 0 },
        totalScoredMarks: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        date: {
          type: Date,
          required: true,
        },
        // Optional: Add academic year/term for better organization
        academicYear: {
          type: String,
          required: false, // e.g., "2024-25"
        },
        term: {
          type: String,
          // enum: ["Term 1", "Term 2", "Term 3", "Annual"],
          required: false,
        }
      },
    ],
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Enhanced pre-save hook with better error handling and duplicate subject validation
resultSchema.pre("save", function (next) {
  try {
    if (this.results && this.results.length > 0) {
      this.results = this.results.map((exam) => {
        if (exam.subjects && exam.subjects.length > 0) {
          // Check for duplicate subjects within the same exam
          const subjectNames = exam.subjects.map(subject => subject.subjectName.toLowerCase());
          const uniqueSubjectNames = [...new Set(subjectNames)];
          
          if (subjectNames.length !== uniqueSubjectNames.length) {
            const error = new Error('Duplicate subjects are not allowed in the same exam result');
            error.name = 'ValidationError';
            throw error;
          }

          const totalMax = exam.subjects.reduce(
            (sum, subj) => sum + (subj.maxMarks || 0),
            0
          );
          const totalScored = exam.subjects.reduce(
            (sum, subj) => sum + (subj.scoredMarks || 0),
            0
          );
          
          exam.totalMaxMarks = totalMax;
          exam.totalScoredMarks = totalScored;
          exam.percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 100 * 100) / 100 : 0; // Round to 2 decimal places
        } else {
          // Handle case where no subjects are provided
          exam.totalMaxMarks = 0;
          exam.totalScoredMarks = 0;
          exam.percentage = 0;
        }
        return exam;
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Add compound index to improve query performance
resultSchema.index({ studentId: 1, schoolId: 1 });
resultSchema.index({ "results.classId": 1, "results.examType": 1, "results.date": 1 });

// ✅ Instance method to add a new result
resultSchema.methods.addResult = function(newResult) {
  this.results.push(newResult);
  return this.save();
};

// ✅ Instance method to find results by class and exam type
resultSchema.methods.getResultsByClassAndExam = function(classId, examType) {
  return this.results.filter(result => 
    result.classId.toString() === classId.toString() && 
    result.examType === examType
  );
};

// ✅ Static method to find or create a student's result document
resultSchema.statics.findOrCreateStudentResult = async function(studentId, schoolId) {
  let studentResult = await this.findOne({ studentId, schoolId });
  
  if (!studentResult) {
    studentResult = new this({
      studentId,
      schoolId,
      results: []
    });
  }
  
  return studentResult;
};

module.exports = mongoose.model("Result", resultSchema);