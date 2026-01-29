const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
})

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["Credit Card", "Debit Card", "UPI", "Net Banking", "Cash on Delivery"],
  },
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  studentDetails: {
    name: String,
    studentId: String,
    class: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // MODIFIED: Add schoolId field
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
})

// MODIFIED: Add compound index for student, createdAt and schoolId
orderSchema.index({ student: 1, createdAt: -1, schoolId: 1 })

module.exports = mongoose.model("Order", orderSchema)
