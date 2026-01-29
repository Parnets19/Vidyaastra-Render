const express = require("express");
const router = express.Router();
const controller = require("../controllers/superAdminController");

// One-time use or secured registration
router.post("/register", controller.registerSuperAdmin);
router.post("/login", controller.loginSuperAdmin);

module.exports = router;
