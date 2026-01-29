const UniformOrder = require("../models/UniformOrder")
const UniformOrderItem = require("../models/UniformOrderItem")
const UniformItem = require("../models/UniformItem")
const Student = require("../models/Student")

// Create a new uniform order - MODIFIED VERSION
exports.createUniformOrder = async (req, res) => {
  try {
    const { studentId, items, totalAmount, paymentMethod, schoolId } = req.body

    console.log("Creating uniform order with data:", req.body)

    // Validate required fields
    if (!studentId || !schoolId) {
      return res.status(400).json({
        success: false,
        error: "Student ID and School ID are required",
      })
    }

    // Verify student belongs to the school
    const student = await Student.findOne({ _id: studentId, schoolId: schoolId })
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found for this school." })
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No items in the order",
      })
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: "Payment method is required",
      })
    }

    // Validate payment method
    const validPaymentMethods = ["Credit Card", "Debit Card", "UPI", "Net Banking", "Cash on Delivery"]
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method. Valid options: ${validPaymentMethods.join(", ")}`,
      })
    }

    // Create order items and calculate total
    const orderItems = []
    let calculatedTotal = 0

    for (const item of items) {
      console.log("Processing item:", item)

      // MODIFIED: Validate item structure (removed size validation)
      if (!item.item || !item.price) {
        return res.status(400).json({
          success: false,
          error: "Each item must have item ID and price",
        })
      }

      const uniformItem = await UniformItem.findOne({ _id: item.item, schoolId: schoolId })

      if (!uniformItem) {
        return res.status(404).json({
          success: false,
          error: `Item with ID ${item.item} not found or does not belong to this school`,
        })
      }

      console.log("Found uniform item:", {
        id: uniformItem._id,
        name: uniformItem.name,
        stock: uniformItem.stock,
      })

      // Validate quantity and stock
      const quantity = item.quantity || 1
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          error: "Quantity must be at least 1",
        })
      }

      // Check stock availability
      if (uniformItem.stock < quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for item ${uniformItem.name}. Available: ${uniformItem.stock}, Requested: ${quantity}`,
        })
      }

      // Validate price
      if (item.price <= 0) {
        return res.status(400).json({
          success: false,
          error: "Price must be greater than 0",
        })
      }

      // MODIFIED: Create order item without size
      const orderItem = new UniformOrderItem({
        uniformItem: item.item,
        quantity: quantity,
        priceAtOrder: item.price,
        schoolId: schoolId,
      })

      await orderItem.save()
      console.log("Created order item:", orderItem)

      orderItems.push(orderItem._id)
      calculatedTotal += item.price * quantity

      // Update stock
      await UniformItem.findByIdAndUpdate(
        item.item,
        { $inc: { stock: -quantity } }
      )
    }

    // Validate total amount
    if (totalAmount && Math.abs(totalAmount - calculatedTotal) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Total amount mismatch. Expected: ${calculatedTotal}, Received: ${totalAmount}`,
      })
    }

    // Create the order
    const order = new UniformOrder({
      user: studentId,
      items: orderItems,
      totalAmount: totalAmount || calculatedTotal,
      paymentMethod: paymentMethod,
      status: "Pending",
      schoolId: schoolId,
    })

    await order.save()
    console.log("Created order:", order)

    // Populate the order data for response
    const populatedOrder = await UniformOrder.findById(order._id)
      .populate({
        path: "items",
        populate: {
          path: "uniformItem",
          model: "UniformItem",
          populate: {
            path: "classId",
            model: "Class",
            select: "className section"
          }
        },
      })
      .populate("user", "name email phone")

    console.log("Order created successfully:", populatedOrder)

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: populatedOrder,
    })
  } catch (err) {
    console.error("Create uniform order error:", err)
    res.status(500).json({
      success: false,
      error: err.message || "Server Error",
    })
  }
}

// Get all uniform orders for a user - SAME AS BEFORE
exports.getUserUniformOrders = async (req, res) => {
  try {
    const { studentId, schoolId } = req.query

    console.log("Getting orders for student:", studentId, "school:", schoolId)

    if (!studentId || !schoolId) {
      return res.status(400).json({
        success: false,
        error: "Student ID and School ID are required",
      })
    }

    const orders = await UniformOrder.find({ user: studentId, schoolId: schoolId })
      .populate({
        path: "items",
        populate: {
          path: "uniformItem",
          model: "UniformItem",
          populate: {
            path: "classId",
            model: "Class",
            select: "className section"
          }
        },
      })
      .sort("-createdAt")

    console.log(`Found ${orders.length} orders for student ${studentId} in school ${schoolId}`)

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (err) {
    console.error("Get user uniform orders error:", err)
    res.status(500).json({
      success: false,
      error: "Server Error",
    })
  }
}

// Get single uniform order - MODIFIED VERSION
exports.getUniformOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const order = await UniformOrder.findOne({ _id: id, schoolId: schoolId }).populate({
      path: "items",
      populate: {
        path: "uniformItem",
        model: "UniformItem",
        populate: {
          path: "classId",
          model: "Class",
          select: "className section"
        }
      },
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or does not belong to this school",
      })
    }

    res.status(200).json({
      success: true,
      data: order,
    })
  } catch (err) {
    console.error("Get uniform order error:", err)
    res.status(500).json({
      success: false,
      error: "Server Error",
    })
  }
}

// Admin: Get all uniform orders - MODIFIED VERSION
exports.getAllUniformOrders = async (req, res) => {
  try {
    const { schoolId } = req.query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const orders = await UniformOrder.find({ schoolId: schoolId })
      .populate({
        path: "items",
        populate: {
          path: "uniformItem",
          model: "UniformItem",
          populate: {
            path: "classId",
            model: "Class",
            select: "className section"
          }
        },
      })
      .populate("user", "name email phone")
      .sort("-createdAt")

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (err) {
    console.error("Get all uniform orders error:", err)
    res.status(500).json({
      success: false,
      error: "Server Error",
    })
  }
}

// Admin: Update order status - SAME AS BEFORE
exports.updateUniformOrderStatus = async (req, res) => {
  try {
    const { status, schoolId } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid options: ${validStatuses.join(", ")}`,
      })
    }

    const order = await UniformOrder.findByIdAndUpdate(
      { _id: req.params.id, schoolId: schoolId },
      { status, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate({
      path: "items",
      populate: {
        path: "uniformItem",
        model: "UniformItem",
        populate: {
          path: "classId",
          model: "Class",
          select: "className section"
        }
      },
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or does not belong to this school",
      })
    }

    console.log(`Order ${order._id} status updated to: ${status}`)

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    })
  } catch (err) {
    console.error("Update uniform order status error:", err)
    res.status(400).json({
      success: false,
      error: err.message,
    })
  }
}


// Get all uniform orders for a school (gets everything for the school)
exports.getAllUniformOrdersBySchool = async (req, res) => {
  try {
    const { schoolId, status } = req.query

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "School ID is required in query parameters." 
      })
    }

    console.log("Getting ALL uniform orders for school:", schoolId)

    const query = { schoolId: schoolId }

    // Optional status filter
    if (status) {
      query.status = status
    }

    const orders = await UniformOrder.find(query)
      .populate({
        path: "items",
        populate: {
          path: "uniformItem",
          model: "UniformItem",
          populate: {
            path: "classId",
            model: "Class",
            select: "className section"
          }
        },
      })
      .populate("user", "name email phone")
      .sort("-createdAt")

    console.log(`Found ${orders.length} uniform orders for school ${schoolId}`)

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (err) {
    console.error("Get all uniform orders by school error:", err)
    res.status(500).json({
      success: false,
      error: "Server Error",
    })
  }
}


// Get all uniform orders unfiltered - MODIFIED VERSION
exports.getAllUniformOrdersUnfiltered = async (req, res) => {
  try {
    const orders = await UniformOrder.find({})
      .populate({
        path: "items",
        populate: {
          path: "uniformItem",
          model: "UniformItem",
          populate: {
            path: "classId",
            model: "Class",
            select: "className section"
          }
        },
      })
      .populate("user", "name email phone")
      .sort("-createdAt")

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (err) {
    console.error("Get all uniform orders unfiltered error:", err)
    res.status(500).json({
      success: false,
      error: "Server Error",
    })
  }
}
