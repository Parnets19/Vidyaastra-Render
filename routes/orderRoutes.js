

const express = require("express")
const router = express.Router()
const orderController = require("../controllers/orderController")


router.get("/all-unfiltered", orderController.getAllOrdersUnfiltered)
router.get("/by-school", orderController.getAllOrdersBySchool);
// Student-specific order routes (more specific, so they come first)
router.post("/student", orderController.createStudentOrder)
router.get("/student/:studentId", orderController.getStudentOrders)

// General order routes
router.post("/", orderController.createOrder) // Create a new general order
router.get("/", orderController.getAllOrders) // Get all orders

// Get order by ID (most general, comes last to avoid conflicts)
router.get("/:id", orderController.getOrderById)

// Update order status (uses :id, so also comes after more specific routes)
router.put("/:id/status", orderController.updateOrderStatus)

module.exports = router