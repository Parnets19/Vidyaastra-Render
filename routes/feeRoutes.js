const express = require("express");
const router = express.Router();
const feeController = require("../controllers/feeController");

router.get("/all-unfiltered", feeController.getAllFeesUnfiltered)
router.get("/filter-options", feeController.getFilterOptions)

router.post("/", feeController.createFee);
router.get("/", feeController.getFees);
router.put("/pay-installment/:id/:index", feeController.payInstallment);
router.put("/pay-multiple-installments/:id", feeController.payMultipleInstallments);
// NEW: Route to get data for a specific fee installment receipt
router.get("/receipt/:feeId/:installmentIndex", feeController.getFeeInstallmentReceiptData);
router.delete("/:id", feeController.deleteFee);
router.put("/:id", feeController.updateFee);

module.exports = router;
