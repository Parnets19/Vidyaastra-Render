const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const schoolController = require("../controllers/schoolController");

// Multer Storage for Logos
const storage = multer.diskStorage({
  
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../Uploads/logos")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({

  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Images only (jpeg, jpg, png)!"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Pricing Routes
router.get("/pricing", schoolController.getDefaultPricing);
router.post("/pricing/save", schoolController.saveDefaultPricing);

// School Routes
router.post("/logo", upload.single("logo"), schoolController.createSchool);
router.get("/", schoolController.getAllSchools);
router.get("/simple", schoolController.getAllSchoolsSimple);
router.get("/mobile/verify/:schoolCode", schoolController.verifySchoolCodeMobile);
router.get("/:id", schoolController.getSchoolById);
router.put("/logo/:id", upload.single("logo"), schoolController.updateSchool);
router.delete("/:id", schoolController.deleteSchool);
router.post("/login", schoolController.loginSchool);

// Pricing Routes
router.get("/pricing", schoolController.getDefaultPricing);
router.post("/pricing/save", schoolController.saveDefaultPricing);

// Logo-Specific Routes
router.post("/logos/:id", upload.single("logo"), schoolController.uploadLogo);
router.get("/logos/:id", schoolController.getLogo);
router.put("/logos/:id", upload.single("logo"), schoolController.updateLogo);
router.delete("/logos/:id", schoolController.deleteLogo);

module.exports = router;
