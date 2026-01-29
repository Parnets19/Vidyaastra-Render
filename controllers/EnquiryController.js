const Enquiry = require("../models/Enquiry");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();

// Send confirmation email to user
// Enhanced Email Templates with Best Design Practices
// Features:
// - Modern, responsive design with gradients and shadows
// - Embedded social icons as Unicode for better compatibility
// - Improved typography and spacing
// - Logo placeholder - replace with your actual logo URL
// - Brand colors: Red (#e41818), Purple (#210d75), Blue (#007bff)

const sendConfirmationEmail = async (enquiryData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || "Vidyaastra"}" <${process.env.EMAIL_FROM
        }>`,
      to: enquiryData.email,
      subject: "Enquiry Received - We'll Get Back to You Soon! 🎓",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Enquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Logo and Gradient -->
    <tr>
      <td style="padding: 0; background: linear-gradient(135deg, #e41818 0%, #210d75 100%); text-align: center;">
        <img src="https://vidyaastra.com/assets/parnets1-8a6NRplW.jpeg" alt="Vidyaastra Logo" style="display: block; max-width: 200px; height: auto; margin: 20px auto; border-radius: 4px;">
        <h1 style="color: #ffffff; margin: 0 20px 20px; font-size: 28px; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Thank You for Your Enquiry!</h1>
      </td>
    </tr>
    
    <!-- Content Body -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333333; line-height: 1.7; font-size: 16px; margin: 0 0 20px;">
          Dear <strong style="color: #210d75;">${enquiryData.name}</strong>,
        </p>
        
        <p style="color: #333333; line-height: 1.7; font-size: 16px; margin: 0 0 30px;">
          We're thrilled to receive your enquiry! Our dedicated team will review your details and respond within <strong>24-48 hours</strong>. Thank you for considering <a href="https://vidyaastra.com/" style="color: #007bff; text-decoration: none; font-weight: 600;">Vidyaastra</a> – your smart weapon for smarter schools.
        </p>
        
        <!-- Enquiry Details Card -->
        <div style="background-color: #f8f9ff; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 5px solid #007bff; box-shadow: 0 2px 10px rgba(0,123,255,0.1);">
          <h2 style="color: #210d75; margin: 0 0 20px; font-size: 20px; font-weight: 600;">📋 Your Enquiry Details</h2>
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 15px;">
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500; width: 100px;">Name:</td><td style="padding: 8px 0; color: #333;">${enquiryData.name
        }</td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">School:</td><td style="padding: 8px 0; color: #333;">${enquiryData.school
        }</td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Email:</td><td style="padding: 8px 0; color: #333;">${enquiryData.email
        }</td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Phone:</td><td style="padding: 8px 0; color: #333;">${enquiryData.phone
        }</td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Message:</td><td style="padding: 8px 0; color: #333;">${enquiryData.message
        }</td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Submitted:</td><td style="padding: 8px 0; color: #333;">${new Date(
          enquiryData.createdAt
        ).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</td></tr>
          </table>
        </div>
        
        <p style="color: #333333; line-height: 1.7; font-size: 16px; margin: 0 0 10px;">
          Have an urgent question? Reach out anytime at <a href="mailto:${process.env.CONTACT_EMAIL || process.env.EMAIL_FROM
        }" style="color: #007bff; text-decoration: none;">${process.env.CONTACT_EMAIL || process.env.EMAIL_FROM
        }</a> or cantact no: +91 8123486068.
        </p>
      </td>
    </tr>
    
    <!-- Footer with Social Icons -->
    <tr>
      <td style="padding: 0; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #6c757d; font-size: 14px; margin: 20px 0 15px; line-height: 1.5;">
          Best regards,<br>
          <strong style="color: #210d75;">The Vidyaastra Team</strong>
        </p>
        <p style="color: #6c757d; font-size: 14px; margin: 0 0 25px;">
          <a href="https://vidyaastra.com/" style="color: #007bff; text-decoration: none; font-weight: 500;">Visit Our Website</a> | Smart Weapon for Smarter Schools
        </p>
        
        <!-- Social Icons Row -->
       <table align="center" cellpadding="0" cellspacing="0" style="margin:20px auto; text-align:center;">
  <tr>
    <td style="padding:0 10px;">
      <a href="https://www.facebook.com/profile.php?id=61580375357151" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="30" style="display:block;">
      </a>
    </td>
    <td style="padding:0 10px;">
      <a href="" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" width="30" style="display:block;">
      </a>
    </td>
    <td style="padding:0 10px;">
      <a href="https://www.linkedin.com/company/vidyaastra1/about/?viewAsMember=true" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" width="30" style="display:block;">
      </a>
    </td>
    <td style="padding:0 10px;">
      <a href="" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="30" style="display:block;">
      </a>
    </td>
  </tr>
</table>

        
        <p style="color: #adb5bd; font-size: 12px; margin: 0; padding: 0 30px 20px; line-height: 1.4;">
          © 2025 Vidyaastra. All rights reserved. | <a href="https://vidyaastra.com/PrivacyPolicy" style="color: #6c757d;">Privacy Policy</a>
        </p>
      </td>
    </tr>
    
  </table>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to: ${enquiryData.email}`);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
};

// Send notification email to admin
const sendAdminNotification = async (enquiryData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || "Vidyaastra"}" <${process.env.EMAIL_FROM
        }>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 New Enquiry Received from ${enquiryData.name}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Enquiry Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Alert Header -->
    <tr>
      <td style="padding: 0; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); text-align: center; position: relative;">
        <span style="position: absolute; top: 15px; right: 20px; color: #ffffff; font-size: 14px; font-weight: 500;">New Lead</span>
        <img src="https://vidyaastra.com/assets/parnets1-8a6NRplW.jpeg" alt="Vidyaastra Logo" style="display: block; max-width: 200px; height: auto; margin: 25px auto 10px; border-radius: 4px;">
        <h1 style="color: #ffffff; margin: 0 20px 25px; font-size: 26px; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔔 New Enquiry Alert!</h1>
      </td>
    </tr>
    
    <!-- Content Body -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333333; line-height: 1.7; font-size: 16px; margin: 0 0 30px;">
          A fresh enquiry has just landed in your inbox! Here's the complete details:
        </p>
        
        <!-- Enquiry Details Card -->
        <div style="background-color: #f8fff8; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 5px solid #28a745; box-shadow: 0 2px 10px rgba(40,167,69,0.1);">
          <h2 style="color: #155724; margin: 0 0 20px; font-size: 20px; font-weight: 600;">📋 Enquiry Details</h2>
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 15px;">
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500; width: 100px;">Name:</td><td style="padding: 8px 0; color: #333;"><strong>${enquiryData.name
        }</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">School:</td><td style="padding: 8px 0; color: #333;"><strong>${enquiryData.school
        }</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Email:</td><td style="padding: 8px 0; color: #333;"><a href="mailto:${enquiryData.email
        }" style="color: #007bff; text-decoration: none; font-weight: 500;">${enquiryData.email
        }</a></td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Phone:</td><td style="padding: 8px 0; color: #333;"><a href="tel:${enquiryData.phone
        }" style="color: #007bff; text-decoration: none; font-weight: 500;">${enquiryData.phone
        }</a></td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Message:</td><td style="padding: 8px 0; color: #333;">${enquiryData.message
        }</td></tr>
            <tr><td style="padding: 8px 0; color: #555; font-weight: 500;">Submitted:</td><td style="padding: 8px 0; color: #333;">${new Date(
          enquiryData.createdAt
        ).toLocaleString()}</td></tr>
          </table>
        </div>
        
        <div style="text-align: center; padding: 20px; background-color: #e8f5e8; border-radius: 8px; margin: 20px 0;">
          <p style="color: #155724; font-size: 15px; margin: 0; font-weight: 500;">💡 Quick Action: Reply now to engage this lead!</p>
        </div>
      </td>
    </tr>
    
    <!-- Footer with Social Icons -->
    <tr>
      <td style="padding: 0; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #6c757d; font-size: 14px; margin: 20px 0 15px; line-height: 1.5;">
          Automated notification from Vidyaastra Enquiry System
        </p>
        <p style="color: #6c757d; font-size: 14px; margin: 0 0 25px;">
          <a href="https://vidyaastra.com/" style="color: #007bff; text-decoration: none; font-weight: 500;">vidyaastra.com</a>
        </p>
        
        <!-- Social Icons Row -->
       <table align="center" cellpadding="0" cellspacing="0" style="margin:20px auto; text-align:center;">
  <tr>
    <td style="padding:0 10px;">
      <a href="https://www.facebook.com/profile.php?id=61580375357151" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="30" style="display:block;">
      </a>
    </td>
    <td style="padding:0 10px;">
      <a href="" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" width="30" style="display:block;">
      </a>
    </td>
    <td style="padding:0 10px;">
      <a href="https://www.linkedin.com/company/vidyaastra1/about/?viewAsMember=true" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" width="30" style="display:block;">
      </a>
    </td>
    <td style="padding:0 10px;">
      <a href="" target="_blank">
        <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="30" style="display:block;">
      </a>
    </td>
  </tr>
</table>

        
        <p style="color: #adb5bd; font-size: 12px; margin: 0; padding: 0 30px 20px; line-height: 1.4;">
          © 2025 Vidyaastra. All rights reserved.
        </p>
      </td>
    </tr>
    
  </table>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent to: ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
};

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = asyncHandler(async (req, res) => {
  const { name, school, email, phone, message } = req.body;

  // Check if enquiry already exists with same email
  const existingEnquiry = await Enquiry.findOne({
    email,
    createdAt: {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
    },
  });

  if (existingEnquiry) {
    return res.status(400).json({
      success: false,
      message:
        "An enquiry with this email was already submitted today. Please wait before submitting another.",
    });
  }

  const enquiry = await Enquiry.create({
    name,
    school,
    email,
    phone,
    message,
  });

  // Send emails asynchronously (don't wait for them to complete)
  if (process.env.ENABLE_EMAILS === "true") {
    // Send confirmation email to user
    sendConfirmationEmail({
      name: enquiry.name,
      school: enquiry.school,
      email: enquiry.email,
      phone: enquiry.phone,
      message: enquiry.message,
      createdAt: enquiry.createdAt,
    }).catch((error) => {
      console.error("Failed to send confirmation email:", error);
    });

    // Send notification email to admin
    if (process.env.ADMIN_EMAIL) {
      sendAdminNotification({
        name: enquiry.name,
        school: enquiry.school,
        email: enquiry.email,
        phone: enquiry.phone,
        message: enquiry.message,
        createdAt: enquiry.createdAt,
      }).catch((error) => {
        console.error("Failed to send admin notification:", error);
      });
    }
  }

  return res.status(201).json({
    success: true,
    message: "Enquiry submitted successfully",
    data: {
      id: enquiry._id,
      name: enquiry.name,
      school: enquiry.school,
      email: enquiry.email,
      phone: enquiry.phone,
      message: enquiry.message,
      status: enquiry.status,
      createdAt: enquiry.createdAt,
    },
  });
});

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin only)
const getAllEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const priority = req.query.priority;
  const search = req.query.search;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { school: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const enquiries = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Enquiry.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: enquiries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single enquiry
// @route   GET /api/enquiries/:id
// @access  Private (Admin only)
const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
    });
  }

  res.status(200).json({
    success: true,
    data: enquiry,
  });
});

// @desc    Update enquiry status/priority
// @route   PUT /api/enquiries/:id
// @access  Private (Admin only)
const updateEnquiry = asyncHandler(async (req, res) => {
  const { status, priority } = req.body;

  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
    });
  }

  if (status) enquiry.status = status;
  if (priority) enquiry.priority = priority;
  enquiry.updatedAt = Date.now();

  await enquiry.save();

  res.status(200).json({
    success: true,
    message: "Enquiry updated successfully",
    data: enquiry,
  });
});

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private (Admin only)
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
    });
  }

  await Enquiry.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Enquiry deleted successfully",
  });
});

// @desc    Get enquiry statistics
// @route   GET /api/enquiries/stats/dashboard
// @access  Private (Admin only)
const getEnquiryStats = asyncHandler(async (req, res) => {
  const stats = await Enquiry.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalEnquiries = await Enquiry.countDocuments();
  const todayEnquiries = await Enquiry.countDocuments({
    createdAt: {
      $gte: new Date().setHours(0, 0, 0, 0),
    },
  });

  const recentEnquiries = await Enquiry.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name email school status createdAt");

  res.status(200).json({
    success: true,
    data: {
      totalEnquiries,
      todayEnquiries,
      statusStats: stats,
      recentEnquiries,
    },
  });
});

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
};
