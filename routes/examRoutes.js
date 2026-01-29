 
const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");


router.get("/all-unfiltered", examController.getAllExamsUnfiltered)


router.post("/", examController.createExam);
router.get("/", examController.getAllExams); // Optional ?classId=xxx
router.get("/:id", examController.getExamById);
router.put("/:id", examController.updateExam);
router.delete("/:id", examController.deleteExam);

module.exports = router;
