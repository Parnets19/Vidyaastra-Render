const express = require("express");
const router = express.Router();
const controller = require("../controllers/transportController");

// Basic CRUD routes
router.post("/", controller.createTransport);
router.get("/", controller.getAllTransports);
router.get("/all-unfiltered", controller.getAllTransportsUnfiltered);
router.get("/:id", controller.getTransportById);
router.put("/:id", controller.updateTransport);
router.delete("/:id", controller.deleteTransport);

// Student transport selection and booking routes
router.get("/available/list", controller.getAvailableTransports);
router.post("/:transportId/book", controller.bookTransport);

// Payment routes
router.post("/payment/:paymentId/pay", controller.makePayment);
router.get("/payment/history/:studentId", controller.getPaymentHistory);

// Student assignment routes (existing)
router.post("/:transportId/assign-student", controller.assignStudentToTransport);
router.delete("/:transportId/remove-student/:studentId", controller.removeStudentFromTransport);

// Get transport by student (enhanced with payment info)
router.get("/student/:studentId", controller.getStudentTransportDetails);

// Capacity management
router.put("/:id/capacity", controller.updateTransportCapacity);

module.exports = router;