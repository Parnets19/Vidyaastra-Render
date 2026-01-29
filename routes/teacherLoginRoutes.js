const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Import controller functions (make sure they are exported as functions)
const {
  registerTeacher,
  loginTeacher,
  getAllTeachers,
  getTeacherById,
  deleteTeacher,
  updateTeacher,
  getAllTeacherses,
  getTeacherByIdGlobal,
} = require("../controllers/teacherLoginController");

// Ensure uploads/profilePics folder exists
const profilePicPath = path.join(__dirname, "..", "uploads", "profilePics");
if (!fs.existsSync(profilePicPath)) {
  fs.mkdirSync(profilePicPath, { recursive: true }); // create nested dirs
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, "profilePic-" + uniqueSuffix);
  },
});

// Multer upload middleware
const upload = multer({  });

// ✅ Routes

// Register teacher with profilePic upload
router.post(
  "/:schoolId/register",
  upload.single("profilePic"),
  registerTeacher
);
router.put(
  "/:schoolId/teachers/:teacherId",
  upload.single("profilePic"),
  updateTeacher
);

// Teacher login
router.post("/login", loginTeacher);

// Get all teachers by school
router.get("/:schoolId", getAllTeachers);
// routes/teacherRoutes.js
router.delete("/:schoolId/teacher/:teacherId", deleteTeacher);
router.get("/", getAllTeacherses);

// Get teacher by ID (with schoolId check)
router.get("/:schoolId/:teacherId", getTeacherById);
router.get("/teacher/:teacherId", getTeacherByIdGlobal);

module.exports = router;
