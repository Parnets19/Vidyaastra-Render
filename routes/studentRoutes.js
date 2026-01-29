const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const upload = require("../utils/multer"); // Use the proper multer configuration

router.patch('/stats', studentController.getStudentStats);
router.patch('/schools', studentController.getSchoolsWithStudentCounts);
router.get('/classes', studentController.getClassesWithStudentCounts);

router.get("/school/:schoolId", studentController.getStudentsBySchoolId);
router.get("/student/:schoolId/:classId", studentController.getClassDetails);
router.get("/class/:className", studentController.getStudentsByClassName);
router.get("/fix-profile-images", studentController.fixProfileImages);

router.get("/", studentController.getAllStudents);

// PUT THESE LAST
router.get("/:id", studentController.getStudentProfile);
router.post("/", upload.single("profileImage"), studentController.createStudent);
router.put("/:id", upload.single("profileImage"), studentController.updateStudentProfile);

router.post("/:id/profile-image", upload.single("profileImage"), studentController.uploadProfileImage);
router.delete("/:id/profile-image", studentController.deleteProfileImage);

router.delete("/student/:id", studentController.deleteStudent);
router.post("/bulk", studentController.bulkCreateStudents);
router.put("/bulk/update", studentController.bulkUpdateStudents);
router.get('/school/:schoolId/export',studentController.exportStudents);
module.exports = router;
