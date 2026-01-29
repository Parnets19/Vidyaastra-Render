const express = require("express");
const router = express.Router();
const timeTableController = require("../controllers/timeTableController");

// Add timetable
router.post("/:schoolId", timeTableController.addTimetable);

// Get all timetables for a school
router.get("/:schoolId", timeTableController.getAllTimetables);

// Get single timetable by ID
router.get("/:schoolId/:timetableId", timeTableController.getSingleTimetable);
router.get("/", timeTableController.getAllTimetables);
// Update timetable
router.put("/:schoolId/:timetableId", timeTableController.updateTimetable);

// Delete timetable
router.delete("/:schoolId/:timetableId", timeTableController.deleteTimetable);

module.exports = router;
