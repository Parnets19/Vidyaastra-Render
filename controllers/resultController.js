// const Result = require("../models/Result");

// // ==================== CREATE OR ADD TO EXISTING ====================
// exports.createResult = async (req, res) => {
//   try {
//     const { schoolId, studentId } = req.params;
//     const { results } = req.body;

//     if (
//       !schoolId ||
//       !studentId ||
//       !Array.isArray(results) ||
//       results.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "School ID, Student ID (in params) and results array are required.",
//       });
//     }

//     // Validate each result entry
//     for (const result of results) {
//       if (!result.classId || !result.examType || !result.date) {
//         return res.status(400).json({
//           success: false,
//           message: "Each result must have classId, examType, and date.",
//         });
//       }

//       if (!Array.isArray(result.subjects) || result.subjects.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Each result must have at least one subject.",
//         });
//       }
//     }

//     // Find existing result document for this student or create new one
//     let resultDoc = await Result.findOne({ studentId, schoolId });

//     if (resultDoc) {
//       // Add new results to existing document
//       resultDoc.results.push(...results);
//       await resultDoc.save(); // ✅ pre-save recalculates totals

//       res.status(201).json({
//         success: true,
//         message: "Results added successfully to existing student record",
//         data: resultDoc,
//       });
//     } else {
//       // Create new document
//       resultDoc = new Result({ schoolId, studentId, results });
//       await resultDoc.save(); // ✅ pre-save recalculates totals

//       res.status(201).json({
//         success: true,
//         message: "Result created successfully",
//         data: resultDoc,
//       });
//     }
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: "Error creating/adding result",
//       error: err.message,
//     });
//   }
// };

// // ==================== ADD SINGLE RESULT TO EXISTING STUDENT ====================
// exports.addResultToStudent = async (req, res) => {
//   try {
//     const { schoolId, studentId } = req.params;
//     const { classId, examType, examName, subjects, date, academicYear, term } =
//       req.body;

//     if (
//       !classId ||
//       !examType ||
//       !date ||
//       !Array.isArray(subjects) ||
//       subjects.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Class ID, Exam Type, Date, and subjects array are required.",
//       });
//     }

//     // Find existing result document for this student or create new one
//     let resultDoc = await Result.findOne({ studentId, schoolId });

//     if (!resultDoc) {
//       resultDoc = new Result({
//         studentId,
//         schoolId,
//         results: [],
//       });
//     }

//     // Add the new result
//     const newResult = {
//       classId,
//       examType,
//       examName,
//       subjects,
//       date,
//       academicYear,
//       term,
//     };

//     resultDoc.results.push(newResult);
//     await resultDoc.save(); // ✅ pre-save recalculates totals

//     res.status(201).json({
//       success: true,
//       message: "Result added successfully",
//       data: resultDoc,
//     });
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: "Error adding result to student",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET ALL (with Pagination, flatten sub-results) ====================
// exports.getAllResults = async (req, res) => {
//   try {
//     const { schoolId } = req.params;
//     const { page = 1, limit = 10, classId, examType, academicYear } = req.query;

//     if (!schoolId) {
//       return res.status(400).json({
//         success: false,
//         message: "School ID is required in params.",
//       });
//     }

//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 10;

//     const resultDocs = await Result.find({ schoolId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .sort({ createdAt: -1 })
//       .lean();

//     // Flatten results safely with additional filtering
//     let allResults = resultDocs.flatMap((doc) =>
//       (doc.results || [])
//         .filter((r) => {
//           if (classId && r.classId._id.toString() !== classId) return false;
//           if (examType && r.examType !== examType) return false;
//           if (academicYear && r.academicYear !== academicYear) return false;
//           return true;
//         })
//         .map((r) => ({
//           ...r,
//           studentId: doc.studentId,
//           schoolId: doc.schoolId,
//           parentId: doc._id,
//         }))
//     );

//     // Sort by date (most recent first)
//     allResults.sort((a, b) => new Date(b.date) - new Date(a.date));

//     const totalResults = allResults.length;
//     const start = (pageNum - 1) * limitNum;
//     const paginated = allResults.slice(start, start + limitNum);

//     res.status(200).json({
//       success: true,
//       message: "Results fetched successfully",
//       data: paginated,
//       pagination: {
//         totalResults,
//         currentPage: pageNum,
//         totalPages: Math.ceil(totalResults / limitNum),
//         pageSize: limitNum,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching results",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET BY STUDENT ====================
// exports.getResultsByStudent = async (req, res) => {
//   try {
//     const { schoolId, studentId } = req.params;
//     const { classId, examType, academicYear } = req.query;

//     const resultDoc = await Result.findOne({ schoolId, studentId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .lean();

//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "No results found for this student",
//         data: [],
//       });
//     }

//     // Filter and flatten results for this student
//     let studentResults = (resultDoc.results || [])
//       .filter((r) => {
//         if (classId && r.classId._id.toString() !== classId) return false;
//         if (examType && r.examType !== examType) return false;
//         if (academicYear && r.academicYear !== academicYear) return false;
//         return true;
//       })
//       .map((r) => ({
//         ...r,
//         studentId: resultDoc.studentId,
//         schoolId: resultDoc.schoolId,
//         parentId: resultDoc._id,
//       }));

//     // Sort by date (most recent first)
//     studentResults.sort((a, b) => new Date(b.date) - new Date(a.date));

//     res.status(200).json({
//       success: true,
//       message: "Student results fetched successfully",
//       data: studentResults,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching student results",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET RESULTS BY CLASS AND EXAM TYPE ====================
// exports.getResultsByClassAndExam = async (req, res) => {
//   try {
//     const { schoolId, classId, examType } = req.params;

//     const resultDocs = await Result.find({ schoolId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .lean();

//     // Filter results for specific class and exam type
//     const filteredResults = resultDocs.flatMap((doc) =>
//       (doc.results || [])
//         .filter(
//           (r) => r.classId._id.toString() === classId && r.examType === examType
//         )
//         .map((r) => ({
//           ...r,
//           studentId: doc.studentId,
//           schoolId: doc.schoolId,
//           parentId: doc._id,
//         }))
//     );

//     res.status(200).json({
//       success: true,
//       message: "Class exam results fetched successfully",
//       data: filteredResults,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching class exam results",
//       error: err.message,
//     });
//   }
// };

// // ==================== UPDATE (specific sub-result) ====================
exports.updateResult = async (req, res) => {
  try {
    const { schoolId, studentId, resultId } = req.params;
    const { updateFields } = req.body;

    if (!schoolId || !studentId || !resultId) {
      return res.status(400).json({
        success: false,
        message: "School ID, Student ID, and Result ID are required in params.",
      });
    }

    if (!updateFields || typeof updateFields !== "object") {
      return res.status(400).json({
        success: false,
        message: "Update fields are required and must be an object.",
      });
    }

    // Find result document
    const resultDoc = await Result.findOne({ schoolId, studentId });
    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "Result document not found for this student in the school.",
      });
    }

    // Find the specific result item
    const resultItem = resultDoc.results.id(resultId);
    if (!resultItem) {
      return res.status(404).json({
        success: false,
        message: "Specific result not found in results array.",
      });
    }

    // ✅ Validate updates if examType/classId/subjects/date are being changed
    if (updateFields.classId && !updateFields.examType) {
      return res.status(400).json({
        success: false,
        message: "classId update must include examType.",
      });
    }

    if (
      updateFields.subjects &&
      (!Array.isArray(updateFields.subjects) ||
        updateFields.subjects.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Subjects must be a non-empty array if provided.",
      });
    }

    if (updateFields.date && isNaN(new Date(updateFields.date))) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    // ✅ Apply updates
    Object.assign(resultItem, updateFields);

    await resultDoc.save(); // triggers pre-save hooks if any

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: resultItem,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating result",
      error: err.message,
    });
  }
};

// // ==================== UPDATE SPECIFIC SUBJECT IN A RESULT ====================
// exports.updateSubjectInResult = async (req, res) => {
//   try {
//     const { schoolId, studentId, resultId, subjectIndex } = req.params;
//     const { subjectData } = req.body;

//     if (!subjectData) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject data is required.",
//       });
//     }

//     const resultDoc = await Result.findOne({ schoolId, studentId });
//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Result document not found",
//       });
//     }

//     const resultItem = resultDoc.results.id(resultId);
//     if (!resultItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Specific result not found",
//       });
//     }

//     const subjectIdx = parseInt(subjectIndex);
//     if (!resultItem.subjects[subjectIdx]) {
//       return res.status(404).json({
//         success: false,
//         message: "Subject not found at specified index",
//       });
//     }

//     // Update the specific subject
//     Object.assign(resultItem.subjects[subjectIdx], subjectData);
//     await resultDoc.save(); // ✅ pre-save recalculates totals

//     res.status(200).json({
//       success: true,
//       message: "Subject updated successfully",
//       data: resultItem,
//     });
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: "Error updating subject",
//       error: err.message,
//     });
//   }
// };

// // ==================== ADD SUBJECT TO EXISTING RESULT ====================
// exports.addSubjectToResult = async (req, res) => {
//   try {
//     const { schoolId, studentId, resultId } = req.params;
//     const { subject } = req.body;

//     if (
//       !subject ||
//       !subject.subjectName ||
//       subject.maxMarks === undefined ||
//       subject.scoredMarks === undefined ||
//       !subject.grade
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Complete subject data (subjectName, maxMarks, scoredMarks, grade) is required.",
//       });
//     }

//     const resultDoc = await Result.findOne({ schoolId, studentId });
//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Result document not found",
//       });
//     }

//     const resultItem = resultDoc.results.id(resultId);
//     if (!resultItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Specific result not found",
//       });
//     }

//     // Check if subject already exists
//     const existingSubject = resultItem.subjects.find(
//       (s) => s.subjectName === subject.subjectName
//     );
//     if (existingSubject) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject already exists in this result",
//       });
//     }

//     // Add the new subject
//     resultItem.subjects.push(subject);
//     await resultDoc.save(); // ✅ pre-save recalculates totals

//     res.status(201).json({
//       success: true,
//       message: "Subject added successfully",
//       data: resultItem,
//     });
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: "Error adding subject to result",
//       error: err.message,
//     });
//   }
// };

// // ==================== DELETE (specific sub-result) ====================
// exports.deleteResult = async (req, res) => {
//   try {
//     const { schoolId, studentId, resultId } = req.params;

//     const resultDoc = await Result.findOne({ schoolId, studentId });
//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Result document not found",
//       });
//     }

//     const subResult = resultDoc.results.id(resultId);
//     if (!subResult) {
//       return res.status(404).json({
//         success: false,
//         message: "Specific result not found in results array",
//       });
//     }

//     // Use pull() method for better compatibility
//     resultDoc.results.pull({ _id: resultId });
//     await resultDoc.save();

//     res.status(200).json({
//       success: true,
//       message: "Result deleted successfully",
//       data: resultDoc,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error deleting result",
//       error: err.message,
//     });
//   }
// };

// // ==================== DELETE SUBJECT FROM RESULT ====================
// exports.deleteSubjectFromResult = async (req, res) => {
//   try {
//     const { schoolId, studentId, resultId, subjectIndex } = req.params;

//     const resultDoc = await Result.findOne({ schoolId, studentId });
//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Result document not found",
//       });
//     }

//     const resultItem = resultDoc.results.id(resultId);
//     if (!resultItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Specific result not found",
//       });
//     }

//     const subjectIdx = parseInt(subjectIndex);
//     if (!resultItem.subjects[subjectIdx]) {
//       return res.status(404).json({
//         success: false,
//         message: "Subject not found at specified index",
//       });
//     }

//     if (resultItem.subjects.length <= 1) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Cannot delete the last subject. A result must have at least one subject.",
//       });
//     }

//     // Remove the subject
//     resultItem.subjects.splice(subjectIdx, 1);
//     await resultDoc.save(); // ✅ pre-save recalculates totals

//     res.status(200).json({
//       success: true,
//       message: "Subject deleted successfully",
//       data: resultItem,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error deleting subject",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET ALL BY SCHOOL (with Pagination, flatten sub-results) ====================
// exports.getAllResults = async (req, res) => {
//   try {
//     const { schoolId } = req.params;
//     const { page = 1, limit = 10, classId, examType, academicYear } = req.query;

//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 10;

//     const resultDocs = await Result.find({ schoolId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .sort({ createdAt: -1 })
//       .lean();

//     // Flatten results safely with additional filtering
//     let allResults = resultDocs.flatMap((doc) =>
//       (doc.results || [])
//         .filter((r) => {
//           if (classId && r.classId._id.toString() !== classId) return false;
//           if (examType && r.examType !== examType) return false;
//           if (academicYear && r.academicYear !== academicYear) return false;
//           return true;
//         })
//         .map((r) => ({
//           ...r,
//           studentId: doc.studentId,
//           schoolId: doc.schoolId,
//           parentId: doc._id,
//         }))
//     );

//     // Sort by date (most recent first)
//     allResults.sort((a, b) => new Date(b.date) - new Date(a.date));

//     const totalResults = allResults.length;
//     const start = (pageNum - 1) * limitNum;
//     const paginated = allResults.slice(start, start + limitNum);

//     res.status(200).json({
//       success: true,
//       message: "Results fetched successfully",
//       data: paginated,
//       pagination: {
//         totalResults,
//         currentPage: pageNum,
//         totalPages: Math.ceil(totalResults / limitNum),
//         pageSize: limitNum,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching results",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET BY STUDENT ====================
// exports.getResultsByStudent = async (req, res) => {
//   try {
//     const { schoolId, studentId } = req.params;
//     const { classId, examType, academicYear } = req.query;

//     const resultDoc = await Result.findOne({ schoolId, studentId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .lean();

//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "No results found for this student",
//         data: [],
//       });
//     }

//     // Filter and flatten results for this student
//     let studentResults = (resultDoc.results || [])
//       .filter((r) => {
//         if (classId && r.classId._id.toString() !== classId) return false;
//         if (examType && r.examType !== examType) return false;
//         if (academicYear && r.academicYear !== academicYear) return false;
//         return true;
//       })
//       .map((r) => ({
//         ...r,
//         studentId: resultDoc.studentId,
//         schoolId: resultDoc.schoolId,
//         parentId: resultDoc._id,
//       }));

//     // Sort by date (most recent first)
//     studentResults.sort((a, b) => new Date(b.date) - new Date(a.date));

//     res.status(200).json({
//       success: true,
//       message: "Student results fetched successfully",
//       data: studentResults,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching student results",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET RESULTS BY CLASS AND EXAM TYPE ====================
// exports.getResultsByClassAndExam = async (req, res) => {
//   try {
//     const { schoolId, classId, examType } = req.params;

//     const resultDocs = await Result.find({ schoolId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .lean();

//     // Filter results for specific class and exam type
//     const filteredResults = resultDocs.flatMap((doc) =>
//       (doc.results || [])
//         .filter(
//           (r) => r.classId._id.toString() === classId && r.examType === examType
//         )
//         .map((r) => ({
//           ...r,
//           studentId: doc.studentId,
//           schoolId: doc.schoolId,
//           parentId: doc._id,
//         }))
//     );

//     res.status(200).json({
//       success: true,
//       message: "Class exam results fetched successfully",
//       data: filteredResults,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching class exam results",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET STUDENT PERFORMANCE SUMMARY ====================
// exports.getStudentPerformanceSummary = async (req, res) => {
//   try {
//     const { schoolId, studentId } = req.params;
//     const { academicYear } = req.query;

//     const resultDoc = await Result.findOne({ studentId, schoolId })
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .lean();

//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "No results found for this student",
//         data: null,
//       });
//     }

//     // Filter by academic year if provided
//     let results = resultDoc.results || [];
//     if (academicYear) {
//       results = results.filter((r) => r.academicYear === academicYear);
//     }

//     // Calculate performance summary
//     const summary = {
//       studentInfo: resultDoc.studentId,
//       totalExams: results.length,
//       averagePercentage:
//         results.length > 0
//           ? Math.round(
//               (results.reduce((sum, r) => sum + r.percentage, 0) /
//                 results.length) *
//                 100
//             ) / 100
//           : 0,
//       examsByType: {},
//       subjectPerformance: {},
//       recentResults: results
//         .sort((a, b) => new Date(b.date) - new Date(a.date))
//         .slice(0, 5),
//     };

//     // Group by exam type
//     results.forEach((result) => {
//       if (!summary.examsByType[result.examType]) {
//         summary.examsByType[result.examType] = {
//           count: 0,
//           averagePercentage: 0,
//           totalPercentage: 0,
//         };
//       }
//       summary.examsByType[result.examType].count++;
//       summary.examsByType[result.examType].totalPercentage += result.percentage;
//     });

//     // Calculate averages for exam types
//     Object.keys(summary.examsByType).forEach((examType) => {
//       const typeData = summary.examsByType[examType];
//       typeData.averagePercentage =
//         Math.round((typeData.totalPercentage / typeData.count) * 100) / 100;
//       delete typeData.totalPercentage; // Remove helper field
//     });

//     // Subject-wise performance
//     results.forEach((result) => {
//       result.subjects.forEach((subject) => {
//         if (!summary.subjectPerformance[subject.subjectName]) {
//           summary.subjectPerformance[subject.subjectName] = {
//             totalExams: 0,
//             totalMarks: 0,
//             totalMaxMarks: 0,
//             averagePercentage: 0,
//           };
//         }

//         const subjectSummary = summary.subjectPerformance[subject.subjectName];
//         subjectSummary.totalExams++;
//         subjectSummary.totalMarks += subject.scoredMarks;
//         subjectSummary.totalMaxMarks += subject.maxMarks;
//       });
//     });

//     // Calculate subject averages
//     Object.keys(summary.subjectPerformance).forEach((subjectName) => {
//       const subjectData = summary.subjectPerformance[subjectName];
//       subjectData.averagePercentage =
//         subjectData.totalMaxMarks > 0
//           ? Math.round(
//               (subjectData.totalMarks / subjectData.totalMaxMarks) * 100 * 100
//             ) / 100
//           : 0;
//     });

//     res.status(200).json({
//       success: true,
//       message: "Student performance summary fetched successfully",
//       data: summary,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching student performance summary",
//       error: err.message,
//     });
//   }
// };

// // ==================== GET ALL (UNFILTERED, ADMIN ONLY) ====================
// exports.getAllResultsUnfiltered = async (req, res) => {
//   try {
//     const results = await Result.find({})
//       .populate("studentId", "name rollNumber")
//       .populate("results.classId", "className section")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.status(200).json({
//       success: true,
//       message: "All results (unfiltered) fetched successfully",
//       data: results,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching results",
//       error: err.message,
//     });
//   }
// };

const Result = require("../models/Result"); // Assuming Result model is imported here

// ==================== GET BY STUDENT (FIXED) ====================
exports.getResultsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const resultDoc = await Result.findOne({ schoolId, studentId })
      .populate("studentId", "name rollNumber")
      .populate("results.classId", "className section")
      .lean();

    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "No results found for this student",
        data: [],
      });
    }

    const flattenedResults = (resultDoc.results || []).map((result) => ({
      _id: result._id,
      studentId: resultDoc.studentId,
      schoolId: resultDoc.schoolId,
      classId: result.classId,
      examType: result.examType,
      examName: result.examName,
      subjects: result.subjects,
      totalMaxMarks: result.totalMaxMarks,
      totalScoredMarks: result.totalScoredMarks,
      percentage: result.percentage,
      date: result.date,
      academicYear: result.academicYear,
      term: result.term,
      createdAt: resultDoc.createdAt,
      updatedAt: resultDoc.updatedAt,
    }));

    // Sort by date (most recent first)
    flattenedResults.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      message: "Student results fetched successfully",
      data: flattenedResults, // Return flattened array instead of nested structure
    });
  } catch (err) {
    console.error("Error in getResultsByStudent:", err); // Add error logging
    res.status(500).json({
      success: false,
      message: "Error fetching student results",
      error: err.message,
    });
  }
};

// ==================== GET ALL RESULTS (FIXED) ====================
exports.getAllResults = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { page = 1, limit = 10, classId, examType, academicYear } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in params.",
      });
    }

    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 10;

    const resultDocs = await Result.find({ schoolId })
      .populate("studentId", "name rollNumber")
      .populate("results.classId", "className section")
      .sort({ createdAt: -1 })
      .lean();

    const allResults = resultDocs.flatMap((doc) =>
      (doc.results || [])
        .filter((r) => {
          if (classId && r.classId._id.toString() !== classId) return false;
          if (examType && r.examType !== examType) return false;
          if (academicYear && r.academicYear !== academicYear) return false;
          return true;
        })
        .map((r) => ({
          _id: r._id,
          studentId: doc.studentId,
          schoolId: doc.schoolId,
          classId: r.classId,
          examType: r.examType,
          examName: r.examName,
          subjects: r.subjects,
          totalMaxMarks: r.totalMaxMarks,
          totalScoredMarks: r.totalScoredMarks,
          percentage: r.percentage,
          date: r.date,
          academicYear: r.academicYear,
          term: r.term,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          parentId: doc._id,
        }))
    );

    // Sort by date (most recent first)
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalResults = allResults.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = allResults.slice(start, start + limitNum);

    res.status(200).json({
      success: true,
      message: "Results fetched successfully",
      data: paginated, // Return flattened paginated results
      pagination: {
        totalResults,
        currentPage: pageNum,
        totalPages: Math.ceil(totalResults / limitNum),
        pageSize: limitNum,
      },
    });
  } catch (err) {
    console.error("Error in getAllResults:", err); // Add error logging
    res.status(500).json({
      success: false,
      message: "Error fetching results",
      error: err.message,
    });
  }
};

// ==================== CREATE OR ADD TO EXISTING ====================
exports.createResult = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;
    const { results } = req.body;

    if (
      !schoolId ||
      !studentId ||
      !Array.isArray(results) ||
      results.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "School ID, Student ID (in params) and results array are required.",
      });
    }

    // Validate each result entry
    for (const result of results) {
      if (!result.classId || !result.examType || !result.date) {
        return res.status(400).json({
          success: false,
          message: "Each result must have classId, examType, and date.",
        });
      }

      if (!Array.isArray(result.subjects) || result.subjects.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Each result must have at least one subject.",
        });
      }

      // Check for duplicate subjects within the same result
      const subjectNames = result.subjects.map(subject => subject.subjectName.toLowerCase());
      const uniqueSubjectNames = [...new Set(subjectNames)];
      
      if (subjectNames.length !== uniqueSubjectNames.length) {
        return res.status(400).json({
          success: false,
          message: "Duplicate subjects are not allowed in the same result. Please ensure each subject appears only once.",
        });
      }
    }

    // Find existing result document for this student or create new one
    let resultDoc = await Result.findOne({ studentId, schoolId });

    if (resultDoc) {
      // Add new results to existing document
      resultDoc.results.push(...results);
      await resultDoc.save(); // ✅ pre-save recalculates totals

      res.status(201).json({
        success: true,
        message: "Results added successfully to existing student record",
        data: resultDoc,
      });
    } else {
      // Create new document
      resultDoc = new Result({ schoolId, studentId, results });
      await resultDoc.save(); // ✅ pre-save recalculates totals

      res.status(201).json({
        success: true,
        message: "Result created successfully",
        data: resultDoc,
      });
    }
  } catch (err) {
    console.error("❌ Error in createResult:", err);
    console.error("❌ Error name:", err.name);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      // Check if it's a standard Mongoose ValidationError with errors property
      if (err.errors && typeof err.errors === 'object') {
        const errors = Object.keys(err.errors).map(key => err.errors[key].message);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors,
          error: err.message,
        });
      } else {
        // Handle custom ValidationError from pre-save hook
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: err.message,
        });
      }
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: `Invalid ${err.path}: ${err.value}`,
      });
    }
    
    res.status(400).json({
      success: false,
      message: "Error creating/adding result",
      error: err.message,
    });
  }
};

// ==================== ADD SINGLE RESULT TO EXISTING STUDENT ====================
exports.addResultToStudent = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;
    const { classId, examType, examName, subjects, date, academicYear, term } =
      req.body;

    if (
      !classId ||
      !examType ||
      !date ||
      !Array.isArray(subjects) ||
      subjects.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Class ID, Exam Type, Date, and subjects array are required.",
      });
    }

    // Find existing result document for this student or create new one
    let resultDoc = await Result.findOne({ studentId, schoolId });

    if (!resultDoc) {
      resultDoc = new Result({
        studentId,
        schoolId,
        results: [],
      });
    }

    // Add the new result
    const newResult = {
      classId,
      examType,
      examName,
      subjects,
      date,
      academicYear,
      term,
    };

    resultDoc.results.push(newResult);
    await resultDoc.save(); // ✅ pre-save recalculates totals

    res.status(201).json({
      success: true,
      message: "Result added successfully",
      data: resultDoc,
    });
  } catch (err) {
    console.error("❌ Error in addResultToStudent:", err);
    console.error("❌ Error name:", err.name);
    console.error("❌ Error message:", err.message);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      // Check if it's a standard Mongoose ValidationError with errors property
      if (err.errors && typeof err.errors === 'object') {
        const errors = Object.keys(err.errors).map(key => err.errors[key].message);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors,
          error: err.message,
        });
      } else {
        // Handle custom ValidationError from pre-save hook
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: err.message,
        });
      }
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: `Invalid ${err.path}: ${err.value}`,
      });
    }
    
    res.status(400).json({
      success: false,
      message: "Error adding result to student",
      error: err.message,
    });
  }
};

// ==================== GET RESULTS BY CLASS AND EXAM TYPE ====================
exports.getResultsByClassAndExam = async (req, res) => {
  try {
    const { schoolId, classId, examType } = req.params;

    const resultDocs = await Result.find({ schoolId })
      .populate("studentId", "name rollNumber")
      .populate("results.classId", "className section")
      .lean();

    // Filter results for specific class and exam type
    const filteredResults = resultDocs.flatMap((doc) =>
      (doc.results || [])
        .filter(
          (r) => r.classId._id.toString() === classId && r.examType === examType
        )
        .map((r) => ({
          ...r,
          studentId: doc.studentId,
          schoolId: doc.schoolId,
          parentId: doc._id,
        }))
    );

    res.status(200).json({
      success: true,
      message: "Class exam results fetched successfully",
      data: filteredResults,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching class exam results",
      error: err.message,
    });
  }
};

// ==================== UPDATE (specific sub-result) ====================
// exports.updateResult = async (req, res) => {
//   try {
//     const { schoolId, studentId, resultId } = req.params
//     const { updateFields } = req.body

//     if (!updateFields) {
//       return res.status(400).json({
//         success: false,
//         message: "Update fields are required.",
//       })
//     }

//     const resultDoc = await Result.findOne({ schoolId, studentId })
//     if (!resultDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Result document not found",
//       })
//     }

//     const resultItem = resultDoc.results.id(resultId)
//     if (!resultItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Specific result not found in results array",
//       })
//     }

//     // Update only provided fields
//     Object.assign(resultItem, updateFields)
//     await resultDoc.save() // ✅ pre-save recalculates totals

//     res.status(200).json({
//       success: true,
//       message: "Result updated successfully",
//       data: resultItem,
//     })
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: "Error updating result",
//       error: err.message,
//     })
//   }
// }

// ==================== UPDATE SPECIFIC SUBJECT IN A RESULT ====================
exports.updateSubjectInResult = async (req, res) => {
  try {
    const { schoolId, studentId, resultId, subjectIndex } = req.params;
    const { subjectData } = req.body;

    if (!subjectData) {
      return res.status(400).json({
        success: false,
        message: "Subject data is required.",
      });
    }

    const resultDoc = await Result.findOne({ schoolId, studentId });
    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "Result document not found",
      });
    }

    const resultItem = resultDoc.results.id(resultId);
    if (!resultItem) {
      return res.status(404).json({
        success: false,
        message: "Specific result not found",
      });
    }

    const subjectIdx = Number.parseInt(subjectIndex);
    if (!resultItem.subjects[subjectIdx]) {
      return res.status(404).json({
        success: false,
        message: "Subject not found at specified index",
      });
    }

    // Update the specific subject
    Object.assign(resultItem.subjects[subjectIdx], subjectData);
    await resultDoc.save(); // ✅ pre-save recalculates totals

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: resultItem,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating subject",
      error: err.message,
    });
  }
};

// ==================== ADD SUBJECT TO EXISTING RESULT ====================
exports.addSubjectToResult = async (req, res) => {
  try {
    const { schoolId, studentId, resultId } = req.params;
    const { subject } = req.body;

    if (
      !subject ||
      !subject.subjectName ||
      subject.maxMarks === undefined ||
      subject.scoredMarks === undefined ||
      !subject.grade
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete subject data (subjectName, maxMarks, scoredMarks, grade) is required.",
      });
    }

    const resultDoc = await Result.findOne({ schoolId, studentId });
    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "Result document not found",
      });
    }

    const resultItem = resultDoc.results.id(resultId);
    if (!resultItem) {
      return res.status(404).json({
        success: false,
        message: "Specific result not found",
      });
    }

    // Check if subject already exists (case-insensitive comparison)
    const existingSubject = resultItem.subjects.find(
      (s) => s.subjectName.toLowerCase() === subject.subjectName.toLowerCase()
    );
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists in this result. Please use a different subject name or update the existing one.",
      });
    }

    // Add the new subject
    resultItem.subjects.push(subject);
    await resultDoc.save(); // ✅ pre-save recalculates totals

    res.status(201).json({
      success: true,
      message: "Subject added successfully",
      data: resultItem,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error adding subject to result",
      error: err.message,
    });
  }
};

// ==================== DELETE (specific sub-result) ====================
exports.deleteResult = async (req, res) => {
  try {
    const { schoolId, studentId, resultId } = req.params;

    const resultDoc = await Result.findOne({ schoolId, studentId });
    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "Result document not found",
      });
    }

    const subResult = resultDoc.results.id(resultId);
    if (!subResult) {
      return res.status(404).json({
        success: false,
        message: "Specific result not found in results array",
      });
    }

    // Use pull() method for better compatibility
    resultDoc.results.pull({ _id: resultId });
    await resultDoc.save();

    res.status(200).json({
      success: true,
      message: "Result deleted successfully",
      data: resultDoc,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting result",
      error: err.message,
    });
  }
};

// ==================== DELETE SUBJECT FROM RESULT ====================
exports.deleteSubjectFromResult = async (req, res) => {
  try {
    const { schoolId, studentId, resultId, subjectIndex } = req.params;

    const resultDoc = await Result.findOne({ schoolId, studentId });
    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "Result document not found",
      });
    }

    const resultItem = resultDoc.results.id(resultId);
    if (!resultItem) {
      return res.status(404).json({
        success: false,
        message: "Specific result not found",
      });
    }

    const subjectIdx = Number.parseInt(subjectIndex);
    if (!resultItem.subjects[subjectIdx]) {
      return res.status(404).json({
        success: false,
        message: "Subject not found at specified index",
      });
    }

    if (resultItem.subjects.length <= 1) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the last subject. A result must have at least one subject.",
      });
    }

    // Remove the subject
    resultItem.subjects.splice(subjectIdx, 1);
    await resultDoc.save(); // ✅ pre-save recalculates totals

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      data: resultItem,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting subject",
      error: err.message,
    });
  }
};

// ==================== GET STUDENT PERFORMANCE SUMMARY ====================
exports.getStudentPerformanceSummary = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;
    const { academicYear } = req.query;

    const resultDoc = await Result.findOne({ studentId, schoolId })
      .populate("studentId", "name rollNumber")
      .populate("results.classId", "className section")
      .lean();

    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "No results found for this student",
        data: null,
      });
    }

    // Filter by academic year if provided
    let results = resultDoc.results || [];
    if (academicYear) {
      results = results.filter((r) => r.academicYear === academicYear);
    }

    // Calculate performance summary
    const summary = {
      studentInfo: resultDoc.studentId,
      totalExams: results.length,
      averagePercentage:
        results.length > 0
          ? Math.round(
              (results.reduce((sum, r) => sum + r.percentage, 0) /
                results.length) *
                100
            ) / 100
          : 0,
      examsByType: {},
      subjectPerformance: {},
      recentResults: results
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    };

    // Group by exam type
    results.forEach((result) => {
      if (!summary.examsByType[result.examType]) {
        summary.examsByType[result.examType] = {
          count: 0,
          averagePercentage: 0,
          totalPercentage: 0,
        };
      }
      summary.examsByType[result.examType].count++;
      summary.examsByType[result.examType].totalPercentage += result.percentage;
    });

    // Calculate averages for exam types
    Object.keys(summary.examsByType).forEach((examType) => {
      const typeData = summary.examsByType[examType];
      typeData.averagePercentage =
        Math.round((typeData.totalPercentage / typeData.count) * 100) / 100;
      delete typeData.totalPercentage; // Remove helper field
    });

    // Subject-wise performance
    results.forEach((result) => {
      result.subjects.forEach((subject) => {
        if (!summary.subjectPerformance[subject.subjectName]) {
          summary.subjectPerformance[subject.subjectName] = {
            totalExams: 0,
            totalMarks: 0,
            totalMaxMarks: 0,
            averagePercentage: 0,
          };
        }

        const subjectSummary = summary.subjectPerformance[subject.subjectName];
        subjectSummary.totalExams++;
        subjectSummary.totalMarks += subject.scoredMarks;
        subjectSummary.totalMaxMarks += subject.maxMarks;
      });
    });

    // Calculate subject averages
    Object.keys(summary.subjectPerformance).forEach((subjectName) => {
      const subjectData = summary.subjectPerformance[subjectName];
      subjectData.averagePercentage =
        subjectData.totalMaxMarks > 0
          ? Math.round(
              (subjectData.totalMarks / subjectData.totalMaxMarks) * 100 * 100
            ) / 100
          : 0;
    });

    res.status(200).json({
      success: true,
      message: "Student performance summary fetched successfully",
      data: summary,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching student performance summary",
      error: err.message,
    });
  }
};

// ==================== GET ALL (UNFILTERED, ADMIN ONLY) ====================
exports.getAllResultsUnfiltered = async (req, res) => {
  try {
    const resultDocs = await Result.find({})
      .populate("studentId", "name rollNumber")
      .populate("results.classId", "className section")
      .sort({ createdAt: -1 })
      .lean();

    const allResults = resultDocs.flatMap((doc) =>
      (doc.results || []).map((r) => ({
        _id: r._id,
        studentId: doc.studentId,
        schoolId: doc.schoolId,
        classId: r.classId,
        examType: r.examType,
        examName: r.examName,
        subjects: r.subjects,
        totalMaxMarks: r.totalMaxMarks,
        totalScoredMarks: r.totalScoredMarks,
        percentage: r.percentage,
        date: r.date,
        academicYear: r.academicYear,
        term: r.term,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        parentId: doc._id,
      }))
    );

    // Sort by date (most recent first)
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      message: "All results (unfiltered) fetched successfully",
      data: allResults,
    });
  } catch (err) {
    console.error("Error in getAllResultsUnfiltered:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching results",
      error: err.message,
    });
  }
};
