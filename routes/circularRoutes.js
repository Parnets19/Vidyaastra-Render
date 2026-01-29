const express = require("express");
const router = express.Router();
const controller = require("../controllers/circularController");

router.get("/all-unfiltered", controller.getAllCircularsUnfiltered)

router.post("/", controller.createCircular);
router.get("/", controller.getAllCirculars);
router.get("/:id", controller.getCircularById);
router.put("/:id", controller.updateCircular);
router.delete("/:id", controller.deleteCircular);
router.put("/mark-all/read", controller.markAllAsRead); // For "Mark All as Read"

module.exports = router;
