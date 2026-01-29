// routes/subjectRoutes.js
const express = require("express");
const {
  createSubject,
  deleteSubject,
  getAllSubjects,
  getSubjectsBySchool,
  updateSubject,
} = require("../controllers/SubjectController");

const router = express.Router();

// School ID is always in params
router.post("/:schoolId/subjects", createSubject);              // Create
router.get("/:schoolId/subjects", getAllSubjects);              // Get All subjects for school
router.get("/:schoolId/subjects/:subjectId", getSubjectsBySchool); // Get one subject by ID
router.put("/:schoolId/subjects/:subjectId", updateSubject);    // Update
router.delete("/:schoolId/subjects/:subjectId", deleteSubject); // Delete

module.exports = router;
