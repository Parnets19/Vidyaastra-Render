const mongoose = require("mongoose")
const Student = require("../models/Student")
const Order = require("../models/Order")
const Book = require("../models/Book")

// Create a new order (general, not student-specific)
exports.createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    // Validate items and calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      // Validate if book ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(item.book)) {
        return res.status(400).json({ message: `Invalid book ID format for item: ${item.book}` })
      }
      const book = await Book.findById({ _id: new mongoose.Types.ObjectId(item.book), schoolId: schoolId }) // MODIFIED: Filter book by schoolId
      if (!book) {
        return res.status(400).json({ message: `Book with ID ${item.book} not found for this school` })
      }

      if (book.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${book.title} in this school` })
      }

      totalAmount += book.price * item.quantity
      orderItems.push({
        book: book._id,
        quantity: item.quantity,
        price: book.price,
      })
    }

    // Create the order
    const order = new Order({
      items: orderItems,
      totalAmount,
      paymentMethod,
      schoolId, // MODIFIED: Add schoolId
      // Note: This general createOrder does not require a student field
    })

    // Save the order and update book stocks
    const newOrder = await order.save()

    // Update book stocks
    for (const item of orderItems) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: -item.quantity },
      })
    }

    res.status(201).json(newOrder)
  } catch (err) {
    console.error("General order creation error:", err)
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for ${err.path}: ${err.value}. Please ensure all IDs are valid.`,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      })
    }
    res.status(400).json({ message: err.message })
  }
}

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    // MODIFIED: Populate items.book with classId
    const orders = await Order.find({ schoolId: schoolId }) // MODIFIED: Filter by schoolId
      .populate({
        path: "items.book",
        select: "title author price image classId", // Include classId
        populate: {
          path: "classId", // Populate the classId field within the book
          select: "className section", // Select class name and section
        },
      })
      .populate("student", "name studentId class") // Populate student details
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query

    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format." })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    // MODIFIED: Populate items.book with classId
    const order = await Order.findById({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
      .populate({
        path: "items.book",
        select: "title author price image classId", // Include classId
        populate: {
          path: "classId", // Populate the classId field within the book
          select: "className section", // Select class name and section
        },
      })
      .populate("student", "name studentId class") // Populate student details

    if (!order) {
      return res.status(404).json({ message: "Order not found or does not belong to this school" })
    }
    res.json(order)
  } catch (err) {
    console.error("Get order by ID error:", err)
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for ${err.path}: ${err.value}. Please ensure all IDs are valid.`,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      })
    }
    res.status(500).json({ message: err.message })
  }
}

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, schoolId } = req.body // MODIFIED: Get schoolId from body

    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID format." })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    // MODIFIED: Populate items.book with classId
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: req.params.id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      { status },
      { new: true },
    )
      .populate({
        path: "items.book",
        select: "title author price image classId", // Include classId
        populate: {
          path: "classId", // Populate the classId field within the book
          select: "className section", // Select class name and section
        },
      })
      .populate("student", "name studentId class") // Populate student details

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found or does not belong to this school" })
    }
    res.json(updatedOrder)
  } catch (err) {
    console.error("Update order status error:", err)
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for ${err.path}: ${err.value}. Please ensure all IDs are valid.`,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      })
    }
    res.status(400).json({ message: err.message })
  }
}

// Create a new order specifically for a student
exports.createStudentOrder = async (req, res) => {
  try {
    const { items, paymentMethod, studentId, schoolId } = req.body // MODIFIED: Get schoolId from body
    console.log("Received studentId:", studentId)

    // Validate if studentId is a valid MongoDB ObjectId string
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error("Invalid studentId format received:", studentId)
      return res
        .status(400)
        .json({ success: false, message: "Invalid student ID format. Please provide a valid student ID." })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId) // Convert to ObjectId

    // Validate student exists for this school
    const student = await Student.findOne({ _id: studentObjectId, schoolId: schoolId }) // MODIFIED: Filter student by schoolId
    console.log("Found student:", student)

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found for this school." })
    }

    console.log("Student _id for order:", student._id)

    // Process order items
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      // Validate if book ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(item.book)) {
        console.error("Invalid book ID format received:", item.book)
        return res.status(400).json({ success: false, message: `Invalid book ID format for item: ${item.book}` })
      }
      const bookObjectId = new mongoose.Types.ObjectId(item.book) // Convert to ObjectId

      const book = await Book.findById({ _id: bookObjectId, schoolId: schoolId }) // MODIFIED: Filter book by schoolId
      if (!book) {
        return res.status(400).json({ success: false, message: `Book with ID ${item.book} not found for this school` })
      }

      if (book.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${book.title}. Available: ${book.stock}, Requested: ${item.quantity}`,
        })
      }

      totalAmount += book.price * item.quantity
      orderItems.push({
        book: book._id,
        quantity: item.quantity,
        price: book.price,
      })
    }

    // Create the order
    const order = new Order({
      items: orderItems,
      totalAmount,
      paymentMethod,
      student: student._id, // This should now always be a valid ObjectId
      studentDetails: {
        name: student.name,
        studentId: student.studentId,
        class: student.class,
      },
      schoolId, // MODIFIED: Add schoolId
    })
    const newOrder = await order.save()

    // Update book stocks
    const bulkOps = orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.book },
        update: { $inc: { stock: -item.quantity } },
      },
    }))
    await Book.bulkWrite(bulkOps)

    res.status(201).json({
      success: true,
      data: newOrder,
    })
  } catch (err) {
    console.error("Order creation error:", err)
    // Provide more specific error messages for Mongoose CastErrors
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for ${err.path}: ${err.value}. Please ensure all IDs are valid.`,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      })
    }
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  }
}

// Get orders for a specific student
exports.getStudentOrders = async (req, res) => {
  try {
    console.log("getStudentOrders: Received studentId from params:", req.params.studentId)
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    // Validate if studentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.studentId)) {
      return res.status(400).json({ message: "Invalid student ID format." })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    // MODIFIED: Populate items.book with classId
    const orders = await Order.find({ student: req.params.studentId, schoolId: schoolId }) // MODIFIED: Filter by studentId AND schoolId
      .populate({
        path: "items.book",
        select: "title author price image classId", // Include classId
        populate: {
          path: "classId", // Populate the classId field within the book
          select: "className section", // Select class name and section
        },
      })
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (err) {
    console.error("Get student orders error:", err)
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for ${err.path}: ${err.value}. Please ensure all IDs are valid.`,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      })
    }
    res.status(500).json({ message: err.message })
  }
}



// Get all orders for a school (gets everything for the school)
exports.getAllOrdersBySchool = async (req, res) => {
  try {
    const { schoolId, status, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    console.log("Getting ALL orders for school:", schoolId);

    const query = { schoolId: schoolId };

    // Optional status filter
    if (status) {
      query.status = status;
    }

    // Convert to numbers for pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Count total documents
    const totalOrders = await Order.countDocuments(query);

    // Fetch paginated orders
    const orders = await Order.find(query)
      .populate({
        path: "items.book",
        select: "title author price image classId",
        populate: {
          path: "classId",
          select: "className section",
        },
      })
      .populate("student", "name studentId class")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log(`Found ${orders.length} orders for school ${schoolId}`);

    res.json({
      success: true,
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (err) {
    console.error("Get all orders by school error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
  



exports.getAllOrdersUnfiltered = async (req, res) => {
  try {
    // MODIFIED: Populate items.book with classId
    const orders = await Order.find({})
      .populate({
        path: "items.book",
        select: "title author price image classId", // Include classId
        populate: {
          path: "classId", // Populate the classId field within the book
          select: "className section", // Select class name and section
        },
      })
      .populate("student", "name studentId class")
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
