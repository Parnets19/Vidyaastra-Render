const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const upload = require("./utils/multer");

// Import routes
const superAdminRoutes = require("./routes/superAdminRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const birthdayRoutes = require("./routes/birthdayRoutes");
const classworkRoutes = require("./routes/classworkRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const albums = require("./routes/albumRoutes");
const photos = require("./routes/photoRoutes");
const bookRoutes = require("./routes/bookRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uniformRoutes = require("./routes/uniformRoutes");
const attendance = require("./routes/attendanceRoutes");
const fees = require("./routes/feeRoutes");
const timeTableRoutes = require("./routes/timeTableRoutes");
const examRoutes = require("./routes/examRoutes");
const resultRoutes = require("./routes/resultRoutes");
const transportRoutes = require("./routes/transportRoutes");
const circularRoutes = require("./routes/circularRoutes");
const diaryRoutes = require("./routes/diaryRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registerRoutes = require("./routes/registerRoutes");
const authRoutes = require("./routes/authRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const classRoutes = require("./routes/classRoutes");
const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentSystemRoutes = require("./routes/paymentSystemRoutes");
const teacherLoginRoutes = require("./routes/teacherLoginRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const assignmentRoutes = require("./routes/assignmentRoute");
const subject = require("./routes/subjectRoutes");
const enquiryRoutes = require("./routes/enquiryRoute");
const classesRoutes = require("./routes/classRoute");
const exameRoutesType = require("./routes/exameRoute");
const { default: axios } = require("axios");
// Start simple payment verification service
const simplePaymentVerification = require("./simple-payment-verification");
dotenv.config();
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://vidyaastra.com',
    'https://www.vidyaastra.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with increased limits
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Request logging middleware
function parseUserAgent(userAgent) {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect Browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return { browser, os };
}

app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const { browser, os } = parseUserAgent(userAgent);

  // Debug request size
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    console.log(`📏 Request size: ${contentLength} bytes (${(contentLength / 1024 / 1024).toFixed(2)} MB)`);
  }

  next();
});

// FIXED: Static file serving - serve uploads directory with proper configuration
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    // Add proper headers for file serving
    setHeaders: (res, filePath) => {
      // Set proper content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
        res.setHeader("Content-Type", `image/${ext.slice(1)}`);
      } else if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
      }
      // Allow cross-origin requests for files
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

// API Routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/birthdays", birthdayRoutes);
app.use("/api/classwork", classworkRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/albums", albums);
app.use("/api/v1/photos", photos);
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uniform", uniformRoutes);
app.use("/api/attendance", attendance);
app.use("/api/fee", fees);
app.use("/api/timetable", timeTableRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/transports", transportRoutes);
app.use("/api/circulars", circularRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/student/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/class", classRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-system", paymentSystemRoutes);
app.use("/api/teacher", teacherLoginRoutes);
app.use("/api/subject", subject);
app.use("/api/notifications", notificationRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/classes",classesRoutes);
app.use("/api/exam-types", exameRoutesType);
// Error handling middleware


// Debug endpoint to list S3 objects
app.get('/debug-s3', async (req, res) => {
  try {
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const { s3Client } = require('./config/AWS');
    
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: 'students/',
      MaxKeys: 10
    };
    
    const command = new ListObjectsV2Command(listParams);
    const response = await s3Client.send(command);
    
    res.json({
      success: true,
      objects: response.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      })) || []
    });
  } catch (error) {
    console.error('❌ Error listing S3 objects:', error.message);
    res.status(500).json({ error: 'Error listing S3 objects', details: error.message });
  }
});

// Cleanup endpoint to delete empty S3 objects
app.get('/cleanup-empty-s3', async (req, res) => {
  try {
    const { ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client } = require('./config/AWS');
    
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: 'students/',
      MaxKeys: 100
    };
    
    const command = new ListObjectsV2Command(listParams);
    const response = await s3Client.send(command);
    
    const emptyObjects = response.Contents?.filter(obj => obj.Size === 0) || [];
    console.log(`Found ${emptyObjects.length} empty objects to delete`);
    
    const deletePromises = emptyObjects.map(async (obj) => {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: obj.Key
      });
      await s3Client.send(deleteCommand);
      console.log(`Deleted empty object: ${obj.Key}`);
    });
    
    await Promise.all(deletePromises);
    
    res.json({
      success: true,
      message: `Deleted ${emptyObjects.length} empty objects`,
      deletedObjects: emptyObjects.map(obj => obj.Key)
    });
  } catch (error) {
    console.error('❌ Error cleaning up S3 objects:', error.message);
    res.status(500).json({ error: 'Error cleaning up S3 objects', details: error.message });
  }
});

// Clear student profile images from database
app.get('/clear-student-images', async (req, res) => {
  try {
    const Student = require('./models/Student');
    
    // Clear profileImage field for all students
    const result = await Student.updateMany(
      { profileImage: { $exists: true, $ne: "" } },
      { $unset: { profileImage: 1 } }
    );
    
    console.log(`Cleared profile images for ${result.modifiedCount} students`);
    
    res.json({
      success: true,
      message: `Cleared profile images for ${result.modifiedCount} students`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error clearing student images:', error.message);
    res.status(500).json({ error: 'Error clearing student images', details: error.message });
  }
});

// S3 Image Proxy - serves images from S3 through the backend using AWS SDK
app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    console.log('🖼️ Proxying image:', imageUrl);
    
    // Extract S3 key from URL
    const urlParts = imageUrl.split('vidyaastra.s3.amazonaws.com/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid S3 URL format');
    }
    
    let s3Key = urlParts[1];
    // Remove query parameters if any
    s3Key = s3Key.split('?')[0];
    console.log('🔑 S3 Key:', s3Key);
    console.log('🔑 Full URL:', imageUrl);
    console.log('🔑 Bucket:', process.env.AWS_S3_BUCKET_NAME);
    
    // Use AWS SDK to get the object
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client } = require('./config/AWS');
    
    const getObjectParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    };
    
    const command = new GetObjectCommand(getObjectParams);
    const response = await s3Client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Set appropriate headers
    res.set('Content-Type', response.ContentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.set('Access-Control-Allow-Origin', '*');
    
    res.send(buffer);
    console.log('✅ Image proxied successfully via AWS SDK');
  } catch (error) {
    console.error('❌ Error proxying image:', error.message);
    res.status(500).json({ error: 'Error fetching image', details: error.message });
  }
});

// S3 Image Proxy with path parameter (alternative approach)
app.get('/s3-image/*', async (req, res) => {
  try {
    const s3Path = req.params[0]; // Get everything after /s3-image/
    const imageUrl = `https://vidyaastra.s3.amazonaws.com/${s3Path}`;
    
    console.log('🖼️ Proxying S3 image:', imageUrl);
    
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000
    });

    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Access-Control-Allow-Origin', '*');
    
    res.send(response.data);
    console.log('✅ S3 image proxied successfully');
  } catch (error) {
    console.error('❌ Error proxying S3 image:', error.message);
    res.status(500).json({ error: 'Error fetching S3 image', details: error.message });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: "File too large", 
      message: "The uploaded file exceeds the maximum allowed size" 
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      error: "Unexpected file field", 
      message: "Too many files uploaded" 
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: "Request entity too large", 
      message: "The request payload exceeds the maximum allowed size" 
    });
  }
  
  res.status(500).json({ error: "Something went wrong!" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test image upload endpoint
app.post("/api/test-upload", upload.single("profileImage"), (req, res) => {
  console.log("🧪 Test upload endpoint called");
  console.log("📸 Request file:", req.file);
  console.log("📋 Request body:", req.body);
  
  if (req.file) {
    res.json({
      success: true,
      message: "File received successfully",
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname
      }
    });
  } else {
    res.json({
      success: false,
      message: "No file received"
    });
  }
});
 
app.use(express.static(path.join(__dirname, 'build'))); // Change 'build' to your frontend folder if needed

// Redirect all requests to the index.html file

app.get("*", (req, res) => {
  return  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, "uploads")}`);
  
  // Simple payment verification service is already started
});
