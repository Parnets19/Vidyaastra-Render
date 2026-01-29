const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');


router.get("/all-unfiltered", holidayController.getAllHolidaysUnfiltered)

// Public routes
router.get('/', holidayController.getAllHolidays);
router.get('/upcoming', holidayController.getUpcomingHolidays);
router.get('/:id', holidayController.getHoliday);
router.post('/', holidayController.createHoliday);
router.put('/:id', holidayController.updateHoliday);
router.delete('/:id', holidayController.deleteHoliday);

module.exports = router;