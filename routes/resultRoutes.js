const express = require("express");
const router = express.Router();
const {
  getAllResultsUnfiltered,
  createResult,
  getAllResults,
  getResultsByStudent,
  updateResult,
  deleteResult,
} = require("../controllers/resultController");

router.get("/all-unfiltered", getAllResultsUnfiltered);

router.post("/:schoolId/:studentId", createResult); // Create result
router.get("/results/:schoolId", getAllResults); // Get all results
router.get("/:studentId", getResultsByStudent); // Get results by student
router.put("/:schoolId/:studentId/:resultId", updateResult);
router.delete("/:schoolId/:studentId/:resultId", deleteResult); // Delete result by ID

module.exports = router;
