const mongoose = require("mongoose")

// Route Stop Schema for individual stops with times
const routeStopSchema = new mongoose.Schema(
  {
    stopName: {
      type: String,
      required: true,
      trim: true,
    },
    stopTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    stopOrder: {
      type: Number,
      required: true,
      min: 1,
    },
    landmark: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
)

// Enhanced Transport Schema with yearly pricing
const transportSchema = new mongoose.Schema(
  {
    route: {
      type: String,
      required: true,
      trim: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    busNumber: {
      type: String,
      required: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
      match: /^[+]?[0-9\s-]{10,16}$/,
    },
    conductorName: {
      type: String,
      trim: true,
    },
    conductorPhone: {
      type: String,
      match: /^[+]?[0-9\s-]{10,16}$/,
    },
    // Route stops with times
    routeStops: [routeStopSchema],

    // Students assigned to this transport
    assignedStudents: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        pickupStop: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        dropoffStop: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "partial", "completed"],
          default: "pending",
        },
      },
    ],

    // Schedule information
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    // Operating days
    operatingDays: [
      {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      },
    ],

    // Transport type
    transportType: {
      type: String,
      enum: ["Bus", "Van", "Auto"],
      default: "Bus",
    },

    // Capacity
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Yearly pricing information (changed from monthly to yearly)
    yearlyFee: {
      type: Number,
      required: true,
      min: 0,
    },

    // Installment options for yearly fee
    installmentOptions: [
      {
        numberOfInstallments: {
          type: Number,
          required: true,
          min: 1,
        },
        installmentAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],

    // Current status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active",
    },

    // School reference
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    // Additional info
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for current occupancy
transportSchema.virtual("currentOccupancy").get(function () {
  return this.assignedStudents ? this.assignedStudents.length : 0
})

// Virtual for available seats
transportSchema.virtual("availableSeats").get(function () {
  return this.totalCapacity - this.currentOccupancy
})

// Compound index for route, busNumber and schoolId
transportSchema.index({ route: 1, busNumber: 1, schoolId: 1 }, { unique: true })

// Index for efficient student queries
transportSchema.index({ "assignedStudents.studentId": 1 })

// Pre-save middleware to sort route stops by order
transportSchema.pre("save", function (next) {
  if (this.routeStops && this.routeStops.length > 0) {
    this.routeStops.sort((a, b) => a.stopOrder - b.stopOrder)
  }
  next()
})

module.exports = mongoose.model("Transport", transportSchema)
