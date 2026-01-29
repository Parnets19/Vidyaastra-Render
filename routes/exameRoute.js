const express = require("express");
const router = express.Router();
const exameTypeController = require("../controllers/exametypeController");

router.post("/", exameTypeController.createExameType);
router.get("/", exameTypeController.getExameTypes);
router.delete("/:id", exameTypeController.deleteExameType);
router.put("/:id", exameTypeController.updateExameType);


module.exports = router;
