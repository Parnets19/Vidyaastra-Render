

const express = require('express');
const multer = require('multer');
const path = require('path');
const albumController = require('../controllers/AlbumController');

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'albums'));
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
    storage: storage, // FIXED: Add missing storage configuration
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: fileFilter
});


// ROUTES


router.get("/all", albumController.getAllAlbumsUnfiltered)

// ✅ Upload new album
router.post('/', upload.array('images', 10), albumController.uploadAlbum);

// ✅ Get all albums
router.get('/', albumController.getAlbums);

// ✅ Get single album by ID
router.get('/:id', albumController.getAlbum);

// ✅ Update album (title/date only)
router.put('/:id', upload.array('images', 10), albumController.updateAlbum);

// ✅ Delete album by ID
router.delete('/:id', albumController.deleteAlbum);

module.exports = router;