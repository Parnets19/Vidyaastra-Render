const Payment = require("../models/Payment")


// ✅ Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const {
      schoolId, // MODIFIED: Get schoolId from body
      packageId,
      name,
      email,
      phone,
      paymentMethod,
      cardDetails,
      upiId,
      amount,
    } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    // Validation: Ensure correct payment method details are provided
    if (paymentMethod === "card" && (!cardDetails || !cardDetails.cardNumber)) {
      return res.status(400).json({ success: false, message: "Card details are required for card payment" })
    }
    if (paymentMethod === "upi" && !upiId) {
      return res.status(400).json({ success: false, message: "UPI ID is required for UPI payment" })
    }

    const payment = new Payment({
      schoolId, // MODIFIED: Add schoolId
      packageId,
      name,
      email,
      phone,
      paymentMethod,
      cardDetails,
      upiId,
      amount,
      status: "pending",
    })

    await payment.save()
    res.status(201).json({ success: true, message: "Payment created successfully", data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message })
  }
}

// ✅ Get all payments
exports.getPayments = async (req, res) => {
  try {
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const payments = await Payment.find({ schoolId: schoolId }) // MODIFIED: Filter by schoolId
      .populate("schoolId", "name email") // Populate school details
      .populate("packageId", "name price") // Populate package details

    res.status(200).json({ success: true, data: payments })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message })
  }
}

// ✅ Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const payment = await Payment.findById({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
      .populate("schoolId", "name email")
      .populate("packageId", "name price")

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found or does not belong to this school" })
    }

    res.status(200).json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message })
  }
}

// ✅ Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" })
    }

    const payment = await Payment.findByIdAndUpdate(
      { _id: req.params.id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      { status },
      { new: true },
    )

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found or does not belong to this school" })
    }

    res.status(200).json({ success: true, message: "Payment status updated", data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message })
  }
}

// ✅ Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const payment = await Payment.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found or does not belong to this school" })
    }

    res.status(200).json({ success: true, message: "Payment deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message })
  }
}
