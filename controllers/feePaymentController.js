const FeePayment = require("../models/FeePayment");
const Fee = require("../models/feeModel");
const Student = require("../models/Student");
const PaymentSettings = require("../models/PaymentSettings");

// ✅ Initiate a fee payment
exports.initiateFeePayment = async (req, res) => {
  try {
    const { studentId, schoolId, feeId, installmentIndex, amount } = req.body;

    if (!studentId || !schoolId || !feeId || installmentIndex === undefined || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: studentId, schoolId, feeId, installmentIndex, amount",
      });
    }

    // Verify the fee exists and belongs to the student
    const fee = await Fee.findOne({ _id: feeId, studentId, schoolId });
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee not found or does not belong to this student",
      });
    }

    // Check if installment exists
    if (!fee.installments[installmentIndex]) {
      return res.status(400).json({
        success: false,
        message: "Invalid installment index",
      });
    }

    const installment = fee.installments[installmentIndex];

    // Check if installment is already paid
    if (installment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This installment is already paid",
      });
    }

    // Verify amount matches installment amount
    if (amount !== installment.amount) {
      return res.status(400).json({
        success: false,
        message: `Amount must be exactly ₹${installment.amount}`,
      });
    }

    // Check if there's already a pending payment for this installment
    const existingPayment = await FeePayment.findOne({
      studentId,
      schoolId,
      feeId,
      installmentIndex,
      status: "pending",
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "A payment is already pending for this installment",
        data: existingPayment,
      });
    }

    // Create new fee payment record
    const feePayment = new FeePayment({
      studentId,
      schoolId,
      feeId,
      installmentIndex,
      amount,
      status: "pending",
      paymentAttempts: [{
        attemptDate: new Date(),
        amount,
        status: "initiated",
      }],
    });

    await feePayment.save();

    // Get payment settings for UPI ID
    const paymentSettings = await PaymentSettings.findOne({ schoolId });
    if (!paymentSettings) {
      return res.status(400).json({
        success: false,
        message: "Payment settings not configured for this school",
      });
    }

    // Generate UPI payment URL
    const upiPaymentUrl = generateUpiPaymentUrl(
      paymentSettings.upiId,
      amount,
      feePayment._id.toString()
    );

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully",
      data: {
        paymentId: feePayment._id,
        amount,
        upiId: paymentSettings.upiId,
        qrCodeUrl: paymentSettings.qrCodeUrl,
        upiPaymentUrl,
        studentId,
        feeId,
        installmentIndex,
      },
    });
  } catch (error) {
    console.error("Error in initiateFeePayment:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get fee payments for a student
exports.getStudentFeePayments = async (req, res) => {
  try {
    const { studentId, schoolId } = req.query;

    if (!studentId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and School ID are required",
      });
    }

    const feePayments = await FeePayment.find({ studentId, schoolId })
      .populate("feeId", "totalAmount installments")
      .populate("studentId", "name rollNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feePayments,
    });
  } catch (error) {
    console.error("Error in getStudentFeePayments:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await FeePayment.findById(paymentId)
      .populate("studentId", "name rollNumber")
      .populate("feeId", "totalAmount installments");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error in getPaymentStatus:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Update payment status (for manual verification)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transactionId, payerUpiId, receiptNumber, notes } = req.body;

    if (!["pending", "paid", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const payment = await FeePayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Update payment details
    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (payerUpiId) payment.payerUpiId = payerUpiId;
    if (receiptNumber) payment.receiptNumber = receiptNumber;
    if (notes) payment.notes = notes;

    if (status === "paid") {
      payment.paidDate = new Date();
      
      // Add to payment attempts
      payment.paymentAttempts.push({
        attemptDate: new Date(),
        amount: payment.amount,
        status: "completed",
        transactionId: transactionId || "",
      });
    }

    await payment.save();

    // If payment is successful, update the fee installment
    if (status === "paid") {
      await updateFeeInstallment(payment.feeId, payment.installmentIndex, {
        status: "paid",
        paidDate: new Date(),
        receiptNumber: receiptNumber || `RCP-${payment._id.toString().slice(-6)}`,
        paymentMethod: "upi",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error in updatePaymentStatus:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get all pending payments for admin
exports.getPendingPayments = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const pendingPayments = await FeePayment.find({ schoolId, status: "pending" })
      .populate("studentId", "name rollNumber class")
      .populate("feeId", "totalAmount installments")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingPayments,
    });
  } catch (error) {
    console.error("Error in getPendingPayments:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Helper function to generate UPI payment URL
function generateUpiPaymentUrl(upiId, amount, transactionId) {
  const params = new URLSearchParams({
    pa: upiId, // Payee address (UPI ID)
    pn: "School Fee Payment", // Payee name
    mc: "0000", // Merchant category code
    tid: transactionId, // Transaction ID
    tr: `FEE-${transactionId}`, // Transaction reference
    am: amount.toString(), // Amount
    cu: "INR", // Currency
  });

  return `upi://pay?${params.toString()}`;
}

// Helper function to update fee installment
async function updateFeeInstallment(feeId, installmentIndex, updateData) {
  const fee = await Fee.findById(feeId);
  if (fee && fee.installments[installmentIndex]) {
    Object.assign(fee.installments[installmentIndex], updateData);
    await fee.save();
  }
}

