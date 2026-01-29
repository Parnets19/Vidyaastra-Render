const Album = require("../models/Album")
const Photo = require("../models/Photo")
const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const path = require("path")
const fs = require("fs")



// @desc    Upload photo for album
// @route   POST /api/v1/albums/:albumId/photos
// @access  Private/Admin
exports.uploadPhoto = asyncHandler(async (req, res, next) => {
  const { schoolId, caption } = req.body // MODIFIED: Get schoolId from body

  if (!schoolId) {
    // MODIFIED: Add schoolId validation
    return next(new ErrorResponse(`School ID is required.`, 400))
  }

  const album = await Album.findOne({ _id: req.params.albumId, schoolId: schoolId }) // MODIFIED: Find album by ID AND schoolId

  if (!album) {
    return next(
      new ErrorResponse(`Album not found with id of ${req.params.albumId} or does not belong to this school`, 404),
    )
  }

  if (!req.file) {
    return next(new ErrorResponse(`Please upload a file`, 400))
  }

  const file = req.file
  const maxSize = Number.parseInt(process.env.MAX_FILE_UPLOAD) || 10000000

  // Check file size
  if (file.size > maxSize) {
    fs.unlinkSync(file.path)
    return next(new ErrorResponse(`Please upload a file less than ${maxSize / 1000000}MB`, 400))
  }

  // Create custom filename
  file.filename = `file_${album._id}_${Date.now()}${path.extname(file.originalname)}`

  // Move to permanent folder, now including schoolId for organization
  const uploadDir = path.join(__dirname, "..", process.env.FILE_UPLOAD_PATH || "uploads/files", schoolId) // MODIFIED: Add schoolId to path
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const newPath = `${uploadDir}/${file.filename}`
  fs.renameSync(file.path, newPath)

  // Save file metadata to DB
  const photo = await Photo.create({
    image: file.filename,
    album: album._id,
    caption: caption || "", // Use caption from body
    schoolId: schoolId, // MODIFIED: Add schoolId to photo
  })

  // Set first file as album cover if none
  if (!album.coverPhoto || album.coverPhoto === "default-album.jpg") {
    album.coverPhoto = file.filename
    await album.save()
  }

  res.status(200).json({
    success: true,
    data: photo,
  })
})

// @desc    Get all photos for album
// @route   GET /api/v1/albums/:albumId/photos
// @access  Public
exports.getPhotos = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.query // MODIFIED: Get schoolId from query

  if (!schoolId) {
    // MODIFIED: Add schoolId validation
    return next(new ErrorResponse(`School ID is required in query parameters.`, 400))
  }

  const photos = await Photo.find({ album: req.params.albumId, schoolId: schoolId }) // MODIFIED: Filter by album ID AND schoolId

  res.status(200).json({
    success: true,
    count: photos.length,
    data: photos,
  })
})

// @desc    Delete photo
// @route   DELETE /api/v1/photos/:id
// @access  Private/Admin
exports.deletePhoto = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

  if (!schoolId) {
    // MODIFIED: Add schoolId validation
    return next(new ErrorResponse(`School ID is required.`, 400))
  }

  const photo = await Photo.findOne({ _id: id, schoolId: schoolId }) // MODIFIED: Find photo by ID AND schoolId

  if (!photo) {
    return next(new ErrorResponse(`Photo not found with id of ${id} or does not belong to this school`, 404))
  }

  // Check if this photo is used as cover for the album
  const album = await Album.findOne({ _id: photo.album, schoolId: schoolId }) // MODIFIED: Find album by ID AND schoolId
  if (album && album.coverPhoto === photo.image) {
    // Find another photo to set as cover within the same school
    const anotherPhoto = await Photo.findOne({ album: album._id, _id: { $ne: photo._id }, schoolId: schoolId }) // MODIFIED: Filter by schoolId
    album.coverPhoto = anotherPhoto ? anotherPhoto.image : "default-album.jpg"
    await album.save()
  }

  // Remove file from filesystem, now considering schoolId in path
  const filePath = path.join(__dirname, "..", process.env.FILE_UPLOAD_PATH || "uploads/files", schoolId, photo.image) // MODIFIED: Add schoolId to path
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  await photo.deleteOne() // This will delete the document found by findOne

  res.status(200).json({
    success: true,
    data: {},
  })
})
