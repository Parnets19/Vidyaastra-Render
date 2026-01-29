const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    schoolCode: { type: String, unique: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    logoUrl: { type: String },
    color: { type: String, default: "#000000" },
    adminNumber: { type: String, required: true, unique: true, trim: true },
    headDepartmentNumber: { type: String, trim: true },
    adminName: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, trim: true, unique: true },
    adminContact: { type: String, required: true, trim: true },
    perStudentPrice: { type: Number, required: true, min: 0, default: 1000 },
    serviceCharge: { type: Number, required: true, min: 0, default: 50 },
    gstServiceCharge: { type: Number, required: true, min: 0, default: 18 },
    totalPayAmount: { type: Number, min: 0, default: 0 },
    totalStudent: { type: Number, required: true, min: 1, default: 1 },
    numberOfInstallments: { type: Number, default: 1, min: 1 },
    installments: [
      {
        amount: { type: Number, required: true, min: 0 },
        paid: { type: Number, default: 0, min: 0 },
        dueDate: { type: Date, required: true },
        paidDate: { type: Date }, 
        paymentMethod: {
          type: String,
          enum: ["Online", "Cash", "Cheque", "Bank Transfer", null],
          default: null,
        },
        receiptUrl: { type: String, default: null },
        remarks: { type: String, trim: true },
        // Virtuals for installments
        pending: {
          type: Number,
          get: function () {
            return Math.max(this.amount - this.paid, 0);
          },
        },
        status: {
          type: String,
          get: function () {
            if (this.paid >= this.amount) return "paid";
            if (this.paid > 0 && this.paid < this.amount) return "partial";
            if (this.dueDate && this.paid < this.amount && new Date() > this.dueDate)
              return "overdue";
            return "pending";
          },
        },
      },
    ],
    duration: { type: Date, required: true },
    isDefaultPricing: { type: Boolean, default: false },
    managementApproved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-calculate totalPayAmount
schoolSchema.pre("save", async function (next) {
  const baseAmount =
    (Number(this.perStudentPrice) || 0) * (Number(this.totalStudent) || 1) +
    (Number(this.serviceCharge) || 0);
  const gstAmount = (baseAmount * (Number(this.gstServiceCharge) || 0)) / 100;
  this.totalPayAmount = Number((baseAmount + gstAmount).toFixed(2));
  next();
});

// Virtuals for school
schoolSchema.virtual("paid").get(function () {
  if (!this.installments || !Array.isArray(this.installments)) return 0;
  return this.installments.reduce((sum, inst) => sum + (Number(inst.paid) || 0), 0);
});

schoolSchema.virtual("pending").get(function () {
  if (!this.installments || !Array.isArray(this.installments)) return 0;
  return this.installments.reduce(
    (sum, inst) => sum + (Number(inst.amount) - Number(inst.paid)),
    0
  );
});

schoolSchema.virtual("paymentStatus").get(function () {
  if (!this.installments || !Array.isArray(this.installments)) return "pending";
  
  const totalInstallments = this.installments.length;
  if (totalInstallments === 0) return "pending";

  const paidInstallments = this.installments.filter((i) => i.status === "paid").length;
  const overdueInstallments = this.installments.filter((i) => i.status === "overdue").length;

  if (paidInstallments === totalInstallments) return "paid";
  if (paidInstallments > 0 || overdueInstallments > 0) return "partial";
  return "pending";
});

module.exports = mongoose.model("School", schoolSchema);