// routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
router.get("/global", eventController.getAllEventsGlobal);

// Alternative route for all events
router.get("/all", eventController.getAllEventsGlobal);
router.post("/", eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);


module.exports = router;
