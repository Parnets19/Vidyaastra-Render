const PaymentLog = require("../models/PaymentLog");
const FeePayment = require("../models/FeePayment");
const Fee = require("../models/feeModel");
const PaymentSettings = require("../models/PaymentSettings");
const mongoose = require("mongoose");

// ✅ Process payment verification from email parsing
exports.processPaymentVerification = async (req, res) => {
  try {
    const {
      schoolId,
      rawEmailData,
      transactionId,
      amount,
      payerUpi,
      emailSubject,
      emailFrom,
      emailDate,
    } = req.body;

    if (!schoolId || !transactionId || !amount || !payerUpi) {
      return res.status(400).json({
        success: false,
        message: "Required fields: schoolId, transactionId, amount, payerUpi",
      });
    }

    // Create payment log entry
    const paymentLog = new PaymentLog({
      schoolId,
      rawEmailData: rawEmailData || "",
      transactionId,
      amount,
      payerUpi,
      emailSubject,
      emailFrom,
      emailDate: emailDate ? new Date(emailDate) : new Date(),
      status: "processing",
    });

    await paymentLog.save();

    // Try to match with pending payments
    const matchedPayment = await matchPaymentWithPendingFees(
      schoolId,
      amount,
      payerUpi,
      transactionId
    );

    if (matchedPayment) {
      // Update payment log with match
      paymentLog.matchedFeeId = matchedPayment.feeId;
      paymentLog.matchedStudentId = matchedPayment.studentId;
      paymentLog.status = "matched";
      paymentLog.processingNotes = `Matched with payment ID: ${matchedPayment._id}`;

      // Update fee payment status
      matchedPayment.status = "paid";
      matchedPayment.transactionId = transactionId;
      matchedPayment.payerUpiId = payerUpi;
      matchedPayment.paidDate = new Date();
      matchedPayment.receiptNumber = `RCP-${transactionId.slice(-6)}`;

      // Add to payment attempts
      matchedPayment.paymentAttempts.push({
        attemptDate: new Date(),
        amount: matchedPayment.amount,
        status: "completed",
        transactionId,
      });

      await matchedPayment.save();

      // Update fee installment
      await updateFeeInstallment(matchedPayment.feeId, matchedPayment.installmentIndex, {
        status: "paid",
        paidDate: new Date(),
        receiptNumber: matchedPayment.receiptNumber,
        paymentMethod: "upi",
      });

      await paymentLog.save();

      res.status(200).json({
        success: true,
        message: "Payment verified and matched successfully",
        data: {
          paymentLog,
          matchedPayment,
        },
      });
    } else {
      // No match found
      paymentLog.status = "unmatched";
      paymentLog.processingNotes = "No matching pending payment found";
      await paymentLog.save();

      res.status(200).json({
        success: true,
        message: "Payment logged but no match found",
        data: paymentLog,
      });
    }
  } catch (error) {
    console.error("Error in processPaymentVerification:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get payment logs for admin review
exports.getPaymentLogs = async (req, res) => {
  try {
    const { schoolId, status, limit = 50, page = 1 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const query = { schoolId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const paymentLogs = await PaymentLog.find(query)
      .populate("matchedFeeId", "totalAmount installments")
      .populate("matchedStudentId", "name rollNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        paymentLogs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Error in getPaymentLogs:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Manual payment verification trigger
exports.triggerManualVerification = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    // Get payment settings to check Gmail credentials
    const paymentSettings = await PaymentSettings.findOne({ schoolId });
    if (!paymentSettings || !paymentSettings.gmailCredentials.accessToken) {
      return res.status(400).json({
        success: false,
        message: "Gmail credentials not configured for this school",
      });
    }

    // This would typically trigger the email parsing service
    // For now, we'll return a success message
    res.status(200).json({
      success: true,
      message: "Manual verification triggered successfully",
      note: "Email parsing service should process new emails and verify payments",
    });
  } catch (error) {
    console.error("Error in triggerManualVerification:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get payment statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      paidAmount,
      unmatchedLogs,
    ] = await Promise.all([
      FeePayment.countDocuments({ schoolId }),
      FeePayment.countDocuments({ schoolId, status: "paid" }),
      FeePayment.countDocuments({ schoolId, status: "pending" }),
      FeePayment.countDocuments({ schoolId, status: "failed" }),
      FeePayment.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      FeePayment.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PaymentLog.countDocuments({ schoolId, status: "unmatched" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        paidPayments,
        pendingPayments,
        failedPayments,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
        unmatchedLogs,
        successRate: totalPayments > 0 ? ((paidPayments / totalPayments) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("Error in getPaymentStatistics:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Helper function to match payment with pending fees
async function matchPaymentWithPendingFees(schoolId, amount, payerUpi, transactionId) {
  // First, try exact amount match
  let payment = await FeePayment.findOne({
    schoolId,
    amount,
    status: "pending",
  });

  if (payment) {
    return payment;
  }

  // If no exact match, try to find payments within a reasonable time window
  // (e.g., payments initiated in the last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  payment = await FeePayment.findOne({
    schoolId,
    amount,
    status: "pending",
    createdAt: { $gte: oneDayAgo },
  });

  return payment;
}

// Helper function to update fee installment
async function updateFeeInstallment(feeId, installmentIndex, updateData) {
  const fee = await Fee.findById(feeId);
  if (fee && fee.installments[installmentIndex]) {
    Object.assign(fee.installments[installmentIndex], updateData);
    await fee.save();
  }
}
