
const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const {
  getAllUniformItems,
  getUniformItem,
  createUniformItem,
  updateUniformItem,
  deleteUniformItem,
  getAllUniformItemsBySchool,
  getAllUniformItemsUnfiltered,
} = require("../controllers/uniformItemController")
const {
  createUniformOrder,
  getUserUniformOrders,
  getUniformOrder,
  getAllUniformOrders,
  updateUniformOrderStatus,
  getAllUniformOrdersBySchool,
  getAllUniformOrdersUnfiltered,
} = require("../controllers/uniformOrderController")

const router = express.Router()

// Ensure uploads directory exists
const uniformsDir = path.join(__dirname, "..", "uploads", "uniforms")
if (!fs.existsSync(uniformsDir)) {
  fs.mkdirSync(uniformsDir, { recursive: true })
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uniformsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `uniform-${uniqueSuffix}${ext}`)
  },
})

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!"), false)
  }
}

// Initialize Multer with error handling
const upload = multer({

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 1, // Only one file at a time
  },
  fileFilter: fileFilter,
})

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      })
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Only one file allowed.",
      })
    }
  }

  if (err.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    })
  }

  next(err)
}


router.get("/items/all-unfiltered", getAllUniformItemsUnfiltered)

router.get("/orders/all-unfiltered", getAllUniformOrdersUnfiltered)

router.get("/items/by-school", getAllUniformItemsBySchool);
router.get("/orders/by-school", getAllUniformOrdersBySchool);


// UNIFORM ITEM ROUTES
// Get all uniform items (with better error handling)
router.get("/items", async (req, res, next) => {
  try {
    await getAllUniformItems(req, res)
  } catch (error) {
    next(error)
  }
})

// Get single uniform item by ID
router.get("/items/:id", async (req, res, next) => {
  try {
    await getUniformItem(req, res)
  } catch (error) {
    next(error)
  }
})

// Create new uniform item (Admin only)
router.post("/items", upload.single("image"), handleMulterError, async (req, res, next) => {
  try {
    await createUniformItem(req, res)
  } catch (error) {
    next(error)
  }
})

// Update uniform item (Admin only)
router.put("/items/:id", upload.single("image"), handleMulterError, async (req, res, next) => {
  try {
    await updateUniformItem(req, res)
  } catch (error) {
    next(error)
  }
})

// Delete uniform item by ID (Admin only)
router.delete("/items/:id", async (req, res, next) => {
  try {
    await deleteUniformItem(req, res)
  } catch (error) {
    next(error)
  }
})

// UNIFORM ORDER ROUTES
// Create uniform order
router.post("/orders", async (req, res, next) => {
  try {
    await createUniformOrder(req, res)
  } catch (error) {
    next(error)
  }
})

// Get all uniform orders (Admin)
router.get("/orders", async (req, res, next) => {
  try {
    await getAllUniformOrders(req, res)
  } catch (error) {
    next(error)
  }
})

// Get user-specific orders
router.get("/orders/user", async (req, res, next) => {
  try {
    await getUserUniformOrders(req, res)
  } catch (error) {
    next(error)
  }
})

// Get single order by ID
router.get("/orders/:id", async (req, res, next) => {
  try {
    await getUniformOrder(req, res)
  } catch (error) {
    next(error)
  }
})

// Update order status (Admin)
router.put("/orders/:id/status", async (req, res, next) => {
  try {
    await updateUniformOrderStatus(req, res)
  } catch (error) {
    next(error)
  }
})

// Health check endpoint for debugging
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Uniform API is working",
    timestamp: new Date().toISOString(),
  })
})

module.exports = router