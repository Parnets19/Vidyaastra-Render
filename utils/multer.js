const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Create uploads directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, "../uploads"),
    path.join(__dirname, "../uploads/assignments"),
    path.join(__dirname, "../uploads/temp"),
    path.join(__dirname, "../uploads/profiles"),
    path.join(__dirname, "../uploads/students"), // Add students directory for profile images
    path.join(__dirname, "../uploads/payment-qr"), // Add payment QR code directory
  ]

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`Created directory: ${dir}`)
    }
  })
}

// Initialize directories
createUploadDirs()

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on the route or field name
    let uploadPath = path.join(__dirname, "../uploads")

    if (req.route && req.route.path.includes("assignments")) {
      uploadPath = path.join(__dirname, "../uploads/assignments")
    } else if (req.route && req.route.path.includes("profile") || file.fieldname === "profileImage") {
      uploadPath = path.join(__dirname, "../uploads/students")
    } else if (file.fieldname === "qrCode") {
      uploadPath = path.join(__dirname, "../uploads/payment-qr")
    } else {
      uploadPath = path.join(__dirname, "../uploads/temp")
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    const baseName = file.fieldname || "file"

    cb(null, `${baseName}-${uniqueSuffix}${extension}`)
  },
})

// File filter function
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|txt/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error("Only images, PDFs, and document files are allowed!"))
  }
}

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_UPLOAD) || 100000000, // 100MB default
    files: 10, // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb)
  },
})

module.exports = upload
