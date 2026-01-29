const express = require('express');
const router = express.Router();
const PhotoController = require('../controllers/PhotoController');

// Admin route (without auth for now)
router.route('/:id')
  .delete(PhotoController.deletePhoto);

module.exports = router;