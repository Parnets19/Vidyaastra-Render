const express = require("express");
const router = express.Router();
const birthdayController = require("../controllers/birthdayController");

// Get all birthdays unfiltered
router.get("/all", birthdayController.getAllBirthdaysUnfiltered);

// NEW: Get birthdays by class (schoolId + classId)
router.get("/by-class", birthdayController.getBirthdaysByClass);

// Get all birthdays by school only (existing API - UNCHANGED)
router.get("/", birthdayController.getAllBirthdays);

// Create birthday (now requires classId)
router.post("/", birthdayController.createBirthday);

// Update birthday
router.put("/:id", birthdayController.updateBirthday);

// Delete birthday
router.delete("/:id", birthdayController.deleteBirthday);

module.exports = router;
