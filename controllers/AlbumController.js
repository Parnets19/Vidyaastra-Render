const Album = require("../models/Album");
const path = require("path");
const fs = require("fs");
const { uploadFile2 } = require("../config/AWS");

// Ensure uploads/albums directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "albums");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadAlbum = async (req, res) => {
  try {
    console.log("📸 Album upload request received");
    console.log("📋 Request body:", req.body);
    console.log("📁 Request files:", req.files);
    
    const { title, date, schoolId } = req.body; // MODIFIED: Get schoolId from body
    const files = req.files;

    if (!schoolId) {
      console.log("❌ School ID missing");
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    // Validate inputs
    if (!title || !date) {
      console.log("❌ Title or date missing");
      return res.status(400).json({ error: "Title and date are required" });
    }
    if (!files || files.length === 0) {
      console.log("❌ No files provided");
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Prepare image data for storage
    console.log("🔄 Starting image upload to S3...");
    const imageData = await Promise.all(
      files.map(async (file, index) => {
        console.log(`📤 Uploading image ${index + 1}/${files.length}: ${file.originalname}`);
        try {
          const s3Path = await uploadFile2(file, 'albums');
          console.log(`✅ Image ${index + 1} uploaded successfully: ${s3Path}`);
          return {
            filename: file.filename,
            // Store relative path instead of full system path
            path: s3Path,
            size: file.size,
            mimetype: file.mimetype,
          };
        } catch (error) {
          console.error(`❌ Failed to upload image ${index + 1}:`, error);
          throw error;
        }
      })
    );


    // Create and save album
    console.log("💾 Creating album in database...");
    const album = new Album({
      title,
      date,
      images: imageData,
      schoolId, // MODIFIED: Add schoolId
    });

    console.log("📝 Album data:", {
      title: album.title,
      date: album.date,
      schoolId: album.schoolId,
      imageCount: album.images.length
    });

    await album.save();
    console.log("✅ Album saved successfully with ID:", album._id);

    res.status(201).json({
      success: true,
      message: "Album uploaded successfully",
      album,
    });
  } catch (error) {
    console.error("❌ Album upload error:", error);
    console.error("❌ Error stack:", error.stack);
    res
      .status(500)
      .json({ 
        success: false,
        error: "Server error during upload", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
};

// GET all albums
exports.getAlbums = async (req, res) => {
  try {
    const { schoolId } = req.query; // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }

    const albums = await Album.find({ schoolId: schoolId }).sort({
      createdAt: -1,
    }); // MODIFIED: Filter by schoolId
    res.status(200).json({ success: true, albums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET single album by ID
exports.getAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query; // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }

    const album = await Album.findOne({ _id: id, schoolId: schoolId }); // FIXED: Use findOne instead of findById
    if (!album) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Album not found or does not belong to this school",
        });
    }
    res.status(200).json({ success: true, album });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT update album title/date only (not images)
exports.updateAlbum = async (req, res) => {
  try {
    const { title, date, schoolId } = req.body; // MODIFIED: Get schoolId from body
    const files = req.files; // FIXED: Get files from request

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const album = await Album.findOneAndUpdate(
      { _id: req.params.id, schoolId: schoolId }, // FIXED: Use findOneAndUpdate instead of findByIdAndUpdate
      { title, date },
      { new: true, runValidators: true }
    );

    if (!album) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Album not found or does not belong to this school",
        });
    }

    // FIXED: Only process files if they exist
    if (files && files.length > 0) {
      const imageData = await Promise.all(
        files.map(async (file) => ({
          filename: file.filename,
          // Store relative path instead of full system path
          path: await uploadFile2(file, 'albums'),
          size: file.size,
          mimetype: file.mimetype,
        }))
      );
      
      if (imageData.length > 0) {
        album.images.push(...imageData);
        await album.save();
      }
    }

    res.status(200).json({ success: true, album });
  } catch (error) {
    console.error("Update album error:", error); // FIXED: Add error logging
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE album and remove images from disk
exports.deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body; // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const album = await Album.findOne({ _id: id, schoolId: schoolId }); // FIXED: Use findOne instead of findById
    if (!album) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Album not found or does not belong to this school",
        });
    }

    // Remove each file from disk
    // album.images.forEach((image) => {
    //   const filePath = path.join(__dirname, "..", image.path);
    //   if (fs.existsSync(filePath)) {
    //     fs.unlinkSync(filePath);
    //   }
    // });

    await Album.findOneAndDelete({ _id: id, schoolId: schoolId }); // FIXED: Use findOneAndDelete instead of findByIdAndDelete
    res
      .status(200)
      .json({ success: true, message: "Album deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllAlbumsUnfiltered = async (req, res) => {
  try {
    const albums = await Album.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, albums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
