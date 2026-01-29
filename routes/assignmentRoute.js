const express = require("express")
const router = express.Router()
const assignmentController = require("../controllers/assignmentController")
const multer = require("multer")
const upload = multer()

router.get("/all-unfiltered", assignmentController.getAllAssignment)
router.get("/submitted", assignmentController.getSubmittedAssignmentsBySchool)
router.get(
  "/submitted-by-classes",
  assignmentController.getSubmittedAssignmentsByClasses
);
// Admin routes
router.get("/admin", assignmentController.getAssignmentsBySchool) // NEW: Route for admin to get assignments by school
// Student routes
router.get("/student", assignmentController.getStudentAssignmentsForStudent) // NEW: Route for students to get their assignments
router.get("/", assignmentController.getStudentAssignments) // This is for teachers to get assignments for their students
router.get("/:id", assignmentController.getAssignment)
router.post("/:id/submit", upload.array("attachments", 5), assignmentController.submitAssignment)

// Teacher routes
router.post("/", assignmentController.createAssignment)
router.put("/:id", assignmentController.updateAssignment)
router.post("/:id/grade", assignmentController.gradeAssignment)
router.delete("/:id", assignmentController.deleteAssignment)

module.exports = router
