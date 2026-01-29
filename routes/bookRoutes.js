const express = require("express");
const router = express.Router();
const bookController = require('../controllers/bookController');
const multer = require('multer');
const path = require('path');

// Configure Multer storage for books
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'books')); // Store book images in uploads/books
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize Multer
const upload = multer({
    
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: fileFilter
});


router.get("/all-unfiltered", bookController.getAllBooksUnfiltered)
router.get("/by-school", bookController.getAllBooksBySchool);
router.get("/", bookController.getAllBooks);

router.get("/:id", bookController.getBookById);

// Create a new book with image upload
router.post('/', upload.single('image'), bookController.createBook);

// Update a book
router.put('/:id', upload.single('image'), bookController.updateBook); // Optional: Support image upload on update

router.delete("/:id", bookController.deleteBook);

module.exports = router;