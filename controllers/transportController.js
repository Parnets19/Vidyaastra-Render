const Transport = require("../models/transportModel");
const TransportPayment = require("../models/transportPaymentModel");
const Student = require("../models/Student");

// Create Transport with Route Stops and Pricing
exports.createTransport = async (req, res) => {
  try {
    const { schoolId, routeStops, yearlyFee, installmentOptions, ...rest } =
      req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    if (!yearlyFee || yearlyFee <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Yearly fee is required and must be greater than 0.",
        });
    }

    // Validate route stops
    if (!routeStops || routeStops.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 route stops are required (start and end).",
      });
    }

    // Validate and set default installment options if not provided
    let validInstallmentOptions = installmentOptions;
    if (!installmentOptions || installmentOptions.length === 0) {
      validInstallmentOptions = [
        {
          numberOfInstallments: 1,
          installmentAmount: yearlyFee,
          description: "Full Payment",
        },
        {
          numberOfInstallments: 2,
          installmentAmount: Math.ceil(yearlyFee / 2),
          description: "2 Installments",
        },
        {
          numberOfInstallments: 3,
          installmentAmount: Math.ceil(yearlyFee / 3),
          description: "3 Installments",
        },
        {
          numberOfInstallments: 4,
          installmentAmount: Math.ceil(yearlyFee / 4),
          description: "4 Installments",
        },
      ];
    }

    // Validate stop orders are sequential
    const sortedStops = routeStops.sort((a, b) => a.stopOrder - b.stopOrder);
    for (let i = 0; i < sortedStops.length; i++) {
      if (sortedStops[i].stopOrder !== i + 1) {
        return res.status(400).json({
          success: false,
          message: "Stop orders must be sequential starting from 1.",
        });
      }
    }

    const transportData = {
      ...rest,
      schoolId,
      routeStops: sortedStops,
      yearlyFee,
      installmentOptions: validInstallmentOptions,
      assignedStudents: [],
    };

    const transport = await Transport.create(transportData);

    const populatedTransport = await Transport.findById(transport._id).populate(
      "schoolId"
     
    );

    res.status(201).json({ success: true, data: populatedTransport });
  } catch (err) {
    console.error("Create transport error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Transports with Route Details
exports.getAllTransports = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query; // default: page 1, 10 records per page

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const skip = (page - 1) * limit;

    // Fetch transports with pagination
    const transports = await Transport.find({ schoolId })
      .populate("assignedStudents.studentId", "name rollNumber classId phone")
      .populate("schoolId")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Count total records for pagination info
    const total = await Transport.countDocuments({ schoolId });

    res.status(200).json({
      success: true,
      data: transports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get all transports (unfiltered) - for admin
// ---------------- GET ALL TRANSPORTS (with Pagination) ----------------
exports.getAllTransportsUnfiltered = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // ✅ Count total documents
    const total = await Transport.countDocuments();

    // ✅ Fetch transports with pagination
    const transports = await Transport.find({})
      .populate("assignedStudents.studentId", "name rollNumber classId")
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!transports || transports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transports found",
      });
    }

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: transports,
    });
  } catch (err) {
    console.error("Get all transports error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get Transport by ID with full details
exports.getTransportById = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query;
    console.log("id",id,schoolId);
    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }

    const transport = await Transport.findOne({ schoolId: schoolId })
      .populate(
        "assignedStudents.studentId",
        "name rollNumber classId phone parentPhone"
      )
      .populate("schoolId");

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: "Transport not found or does not belong to this school",
      });
    }

    res.status(200).json({ success: true, data: transport });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Transport
exports.updateTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId, routeStops, ...updateFields } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    // If updating route stops, validate them
    if (routeStops) {
      if (routeStops.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 route stops are required.",
        });
      }

      const sortedStops = routeStops.sort((a, b) => a.stopOrder - b.stopOrder);
      updateFields.routeStops = sortedStops;
    }

    const transport = await Transport.findOneAndUpdate(
      { _id: id, schoolId: schoolId },
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    ).populate("assignedStudents.studentId", "name rollNumber classId");

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: "Transport not found or does not belong to this school",
      });
    }

    res.status(200).json({ success: true, data: transport });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Transport
exports.deleteTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const transport = await Transport.findOneAndDelete({
      _id: id,
      schoolId: schoolId,
    });

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: "Transport not found or does not belong to this school",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Transport deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Available Transports for Students (with capacity check)
exports.getAvailableTransports = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const transports = await Transport.find({
      schoolId: schoolId,
      status: "Active",
    })
      .populate("schoolId", "name")
      .sort({ routeName: 1 });

    // Filter transports with available capacity
    const availableTransports = transports.filter(
      (transport) => transport.availableSeats > 0
    );

    // Format response with capacity and pricing info
    const formattedTransports = availableTransports.map((transport) => ({
      _id: transport._id,
      routeName: transport.routeName,
      route: transport.route,
      busNumber: transport.busNumber,
      driverName: transport.driverName,
      driverPhone: transport.driverPhone,
      routeStops: transport.routeStops,
      startTime: transport.startTime,
      endTime: transport.endTime,
      operatingDays: transport.operatingDays,
      transportType: transport.transportType,
      totalCapacity: transport.totalCapacity,
      currentOccupancy: transport.currentOccupancy,
      availableSeats: transport.availableSeats,
      yearlyFee: transport.yearlyFee,
      installmentOptions: transport.installmentOptions,
      notes: transport.notes,
    }));

    res.status(200).json({ success: true, data: formattedTransports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Book Transport for Student - FIXED VERSION
exports.bookTransport = async (req, res) => {
  try {
    const { transportId } = req.params;
    const {
      studentId,
      pickupStopId,
      dropoffStopId,
      schoolId,
      numberOfInstallments,
      paymentMethod,
      academicYear,
    } = req.body;

    if (!schoolId || !studentId || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "School ID, Student ID, and Academic Year are required.",
      });
    }

    // Verify student exists and belongs to the school
    const student = await Student.findOne({
      _id: studentId,
      schoolId: schoolId,
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found or does not belong to this school.",
      });
    }

    // Find transport
    const transport = await Transport.findOne({
      _id: transportId,
      schoolId: schoolId,
      status: "Active",
    });
    if (!transport) {
      return res
        .status(404)
        .json({ success: false, message: "Transport not found or inactive." });
    }

    // Check if student is already assigned to any transport
    const existingTransport = await Transport.findOne({
      schoolId: schoolId,
      "assignedStudents.studentId": studentId,
    });
    if (existingTransport) {
      return res.status(400).json({
        success: false,
        message: "Student is already assigned to a transport.",
      });
    }

    // Check capacity
    if (transport.availableSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: "No seats available. Transport is at full capacity.",
        noSeatsAvailable: true,
      });
    }

    // Verify pickup and dropoff stops exist
    const pickupStop = transport.routeStops.id(pickupStopId);
    const dropoffStop = transport.routeStops.id(dropoffStopId);

    if (!pickupStop || !dropoffStop) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickup or dropoff stop." });
    }

    // Validate installment option
    const selectedInstallmentOption = transport.installmentOptions.find(
      (option) => option.numberOfInstallments === numberOfInstallments
    );
    if (!selectedInstallmentOption) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid installment option selected.",
        });
    }

    // Create payment record with first installment already paid
    const paymentData = {
      studentId,
      transportId,
      schoolId,
      totalAmount: transport.yearlyFee,
      numberOfInstallments: selectedInstallmentOption.numberOfInstallments,
      installmentAmount: selectedInstallmentOption.installmentAmount,
      paidAmount: selectedInstallmentOption.installmentAmount, // FIXED: Set first installment as paid
      remainingAmount:
        transport.yearlyFee - selectedInstallmentOption.installmentAmount, // FIXED: Calculate remaining
      installmentsPaid: 1, // FIXED: Set first installment as paid
      remainingInstallments: selectedInstallmentOption.numberOfInstallments - 1, // FIXED: Calculate remaining
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days from now
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next payment due in 90 days
      academicYear,
      paymentHistory: [
        {
          amount: selectedInstallmentOption.installmentAmount,
          paymentMethod: paymentMethod || "upi",
          transactionId: `TXN_${Date.now()}`,
          installmentNumber: 1,
          status: "completed",
          notes: "Initial booking payment",
        },
      ],
    };

    const transportPayment = await TransportPayment.create(paymentData);

    // Add student to transport with correct payment status
    transport.assignedStudents.push({
      studentId: studentId,
      pickupStop: pickupStopId,
      dropoffStop: dropoffStopId,
      paymentStatus: transportPayment.paymentStatus, // This will be "partial" or "completed" based on the payment
    });

    await transport.save();

    // Populate and return the booking details
    const updatedTransport = await Transport.findById(transportId).populate(
      "assignedStudents.studentId",
      "name rollNumber classId"
    );

    const bookingDetails = {
      transport: updatedTransport,
      paymentPlan: transportPayment,
      pickupStop: pickupStop,
      dropoffStop: dropoffStop,
    };

    res.status(201).json({
      success: true,
      message: "Transport booked successfully with first installment paid",
      data: bookingDetails,
    });
  } catch (err) {
    console.error("Book transport error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Assign Student to Transport (existing function)
exports.assignStudentToTransport = async (req, res) => {
  try {
    const { transportId } = req.params;
    const { studentId, pickupStopId, dropoffStopId, schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    // Verify student exists and belongs to the school
    const student = await Student.findOne({
      _id: studentId,
      schoolId: schoolId,
    });
    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found or does not belong to this school.",
        });
    }

    // Find transport
    const transport = await Transport.findOne({
      _id: transportId,
      schoolId: schoolId,
    });
    if (!transport) {
      return res
        .status(404)
        .json({ success: false, message: "Transport not found." });
    }

    // Check if student is already assigned
    const existingAssignment = transport.assignedStudents.find(
      (assignment) => assignment.studentId.toString() === studentId
    );
    if (existingAssignment) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Student is already assigned to this transport.",
        });
    }

    // Check capacity
    if (transport.currentOccupancy >= transport.totalCapacity) {
      return res.status(400).json({
        success: false,
        message: "No seats available. Transport is at full capacity.",
        noSeatsAvailable: true,
      });
    }

    // Verify pickup and dropoff stops exist
    const pickupStop = transport.routeStops.id(pickupStopId);
    const dropoffStop = transport.routeStops.id(dropoffStopId);

    if (!pickupStop || !dropoffStop) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickup or dropoff stop." });
    }

    // Add student assignment
    transport.assignedStudents.push({
      studentId: studentId,
      pickupStop: pickupStopId,
      dropoffStop: dropoffStopId,
    });

    await transport.save();

    const updatedTransport = await Transport.findById(transportId).populate(
      "assignedStudents.studentId",
      "name rollNumber classId"
    );

    res.status(200).json({ success: true, data: updatedTransport });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Remove Student from Transport
exports.removeStudentFromTransport = async (req, res) => {
  try {
    const { transportId, studentId } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const transport = await Transport.findOne({
      _id: transportId,
      schoolId: schoolId,
    });
    if (!transport) {
      return res
        .status(404)
        .json({ success: false, message: "Transport not found." });
    }

    // Remove student assignment
    transport.assignedStudents = transport.assignedStudents.filter(
      (assignment) => assignment.studentId.toString() !== studentId
    );

    await transport.save();

    const updatedTransport = await Transport.findById(transportId).populate(
      "assignedStudents.studentId",
      "name rollNumber classId"
    );

    res.status(200).json({ success: true, data: updatedTransport });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Make Payment for Transport
exports.makePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid payment amount is required." });
    }

    if (!paymentMethod) {
      return res
        .status(400)
        .json({ success: false, message: "Payment method is required." });
    }

    // Find payment record
    const payment = await TransportPayment.findById(paymentId)
      .populate("studentId", "name rollNumber")
      .populate("transportId", "routeName busNumber");

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found." });
    }

    if (payment.paymentStatus === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Payment is already completed." });
    }

    // Check if payment amount exceeds remaining amount
    if (amount > payment.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining amount of ₹${payment.remainingAmount}`,
      });
    }

    // Add payment to history
    const installmentNumber = payment.installmentsPaid + 1;
    payment.paymentHistory.push({
      amount,
      paymentMethod,
      transactionId: transactionId || `TXN_${Date.now()}`,
      installmentNumber,
      status: "completed",
      notes,
    });

    // Update payment totals
    payment.paidAmount += amount;
    payment.installmentsPaid += 1;

    // Calculate next due date if not fully paid
    if (payment.remainingAmount > 0) {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 90); // Next payment due in 90 days
      payment.nextDueDate = nextDue;
    }

    await payment.save();

    // Update student's payment status in transport
    const transport = await Transport.findById(payment.transportId);
    const studentAssignment = transport.assignedStudents.find(
      (assignment) =>
        assignment.studentId.toString() === payment.studentId._id.toString()
    );

    if (studentAssignment) {
      studentAssignment.paymentStatus = payment.paymentStatus;
      await transport.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: payment,
    });
  } catch (err) {
    console.error("Make payment error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get Student's Transport Details with Payment Info - FIXED VERSION
exports.getStudentTransportDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.query;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    // Find transport assignment
    const transport = await Transport.findOne({
      schoolId: schoolId,
      "assignedStudents.studentId": studentId,
    }).populate("schoolId");

    if (!transport) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No transport assigned to this student.",
        });
    }

    // Find payment details
    const paymentDetails = await TransportPayment.findOne({
      studentId: studentId,
      transportId: transport._id,
      schoolId: schoolId,
    });

    // Find the specific student assignment
    const studentAssignment = transport.assignedStudents.find(
      (assignment) => assignment.studentId.toString() === studentId
    );

    // Get pickup and dropoff stop details
    const pickupStop = transport.routeStops.id(studentAssignment.pickupStop);
    const dropoffStop = transport.routeStops.id(studentAssignment.dropoffStop);

    const responseData = {
      transport: {
        _id: transport._id,
        routeName: transport.routeName,
        route: transport.route,
        busNumber: transport.busNumber,
        driverName: transport.driverName,
        driverPhone: transport.driverPhone,
        conductorName: transport.conductorName,
        conductorPhone: transport.conductorPhone,
        routeStops: transport.routeStops,
        startTime: transport.startTime,
        endTime: transport.endTime,
        operatingDays: transport.operatingDays,
        transportType: transport.transportType,
        status: transport.status,
        totalCapacity: transport.totalCapacity,
        currentOccupancy: transport.currentOccupancy,
        availableSeats: transport.availableSeats,
        notes: transport.notes,
      },
      studentPickupStop: pickupStop,
      studentDropoffStop: dropoffStop,
      pickupTime: pickupStop?.stopTime,
      dropoffTime: dropoffStop?.stopTime,
      paymentDetails: paymentDetails || null,
      assignmentDate: studentAssignment.assignedDate,
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (err) {
    console.error("Get student transport details error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Payment History for Student
exports.getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.query;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const paymentRecord = await TransportPayment.findOne({
      studentId: studentId,
      schoolId: schoolId,
    })
      .populate("studentId", "name rollNumber")
      .populate("transportId", "routeName busNumber");

    if (!paymentRecord) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No payment record found for this student.",
        });
    }

    res.status(200).json({ success: true, data: paymentRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Transport Capacity
exports.updateTransportCapacity = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalCapacity, schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    if (!totalCapacity || totalCapacity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Valid capacity is required." });
    }

    const transport = await Transport.findOne({ _id: id, schoolId: schoolId });
    if (!transport) {
      return res
        .status(404)
        .json({ success: false, message: "Transport not found." });
    }

    // Check if new capacity is less than current occupancy
    if (totalCapacity < transport.currentOccupancy) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce capacity below current occupancy of ${transport.currentOccupancy} students.`,
      });
    }

    transport.totalCapacity = totalCapacity;
    await transport.save();

    res.status(200).json({
      success: true,
      message: "Transport capacity updated successfully",
      data: transport,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Helper function to get next stop
exports.getNextStop = (routeStops) => {
  const currentTime = new Date();
  const currentTimeString = `${currentTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;

  for (const stop of routeStops) {
    if (stop.stopTime > currentTimeString) {
      return stop.stopName;
    }
  }

  return routeStops[0]?.stopName || "Route completed";
};
