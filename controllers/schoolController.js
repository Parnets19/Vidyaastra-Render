const School = require("../models/School");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { uploadFile2 } = require("../config/AWS");

// Create School
exports.createSchool = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      password,
      color,
      adminNumber,
      headDepartmentNumber,
      adminName,
      adminEmail,
      adminContact,
      perStudentPrice,
      totalStudent,
      serviceCharge,
      gstServiceCharge,
      numberOfInstallments,
      installments, // 👈 may come as string or array
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Logo is required",
      });
    }

    // Check if email or adminEmail already exists
    const existing = await School.findOne({ $or: [{ email }, { adminEmail }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email or admin email already registered",
      });
    }

    // Check if adminNumber already exists
    const existingAdminNumber = await School.findOne({ adminNumber });
    if (existingAdminNumber) {
      return res.status(400).json({
        success: false,
        message: "Admin number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const logoUrl = await uploadFile2(req.file, `logos`);

    // Convert numbers properly
    const perStudentPriceNum = Number(perStudentPrice) || 0;
    const totalStudentNum = Number(totalStudent) || 0;
    const serviceChargeNum = Number(serviceCharge) || 0;
    const gstServiceChargeNum = Number(gstServiceCharge) || 0;

    // ✅ Auto calculate totalPayAmount
    const baseAmount = perStudentPriceNum * totalStudentNum + serviceChargeNum;
    const gstAmount = (baseAmount * gstServiceChargeNum) / 100;
    const totalPayAmount = Number((baseAmount + gstAmount).toFixed(2));

    // ✅ Parse installments safely
    let parsedInstallments = [];
    if (installments) {
      parsedInstallments =
        typeof installments === "string" ? JSON.parse(installments) : installments;
    }

    // ✅ Generate a unique schoolCode
    let shortName = name.replace(/\s+/g, "").toUpperCase().substring(0, 3);
    let schoolCode;
    let isUnique = false;

    while (!isUnique) {
      let randomNum = Math.floor(1000 + Math.random() * 9000);
      schoolCode = `${shortName}${randomNum}`;

      const existingCode = await School.findOne({ schoolCode });
      if (!existingCode) isUnique = true;
    }

    const newSchool = new School({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      color,
      logoUrl,
      adminNumber,
      headDepartmentNumber,
      adminName,
      adminEmail,
      adminContact,
      perStudentPrice: perStudentPriceNum,
      totalStudent: totalStudentNum,
      serviceCharge: serviceChargeNum,
      gstServiceCharge: gstServiceChargeNum,
      totalPayAmount,
      numberOfInstallments: Number(numberOfInstallments) || 1,
      installments: parsedInstallments, // 👈 fixed
      schoolCode,
      managementApproved: false,
      duration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    });

    await newSchool.save();

    res.status(201).json({
      success: true,
      message: "School registered successfully",
      data: newSchool,
    });
  } catch (err) {
    console.error("Create school error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ================= UPDATE SCHOOL =================
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    const {
      name,
      email,
      phone,
      address,
      color,
      password,
      adminNumber,
      headDepartmentNumber,
      adminName,
      adminEmail,
      adminContact,
      totalStudent,
      perStudentPrice,
      serviceCharge,
      gstServiceCharge,
      managementApproved,
      numberOfInstallments,
      installments, // 👈 may come as string or array
    } = req.body;

    // ✅ Check for conflicts
    if (email && email !== school.email) {
      const existingEmail = await School.findOne({ email });
      if (existingEmail) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered" });
      }
    }

    if (adminEmail && adminEmail !== school.adminEmail) {
      const existingAdminEmail = await School.findOne({ adminEmail });
      if (existingAdminEmail) {
        return res.status(400).json({
          success: false,
          message: "Admin email already registered",
        });
      }
    }

    if (adminNumber && adminNumber !== school.adminNumber) {
      const existingAdminNumber = await School.findOne({ adminNumber });
      if (existingAdminNumber) {
        return res.status(400).json({
          success: false,
          message: "Admin number already registered",
        });
      }
    }

    // ✅ Update logo if a new one is uploaded
    if (req.file) {

      school.logoUrl = await uploadFile2(req.file, `logos`);
    }

    // ✅ Update basic fields
    if (name) school.name = name;
    if (email) school.email = email;
    if (phone) school.phone = phone;
    if (address) school.address = address;
    if (color) school.color = color;
    if (adminNumber) school.adminNumber = adminNumber;
    if (headDepartmentNumber) school.headDepartmentNumber = headDepartmentNumber;
    if (adminName) school.adminName = adminName;
    if (adminEmail) school.adminEmail = adminEmail;
    if (adminContact) school.adminContact = adminContact;
    if (typeof managementApproved !== "undefined") {
      school.managementApproved = managementApproved;
    }

    // ✅ Update numeric fields
    if (totalStudent !== undefined && totalStudent !== "")
      school.totalStudent = Number(totalStudent);

    if (perStudentPrice !== undefined && perStudentPrice !== "")
      school.perStudentPrice = Number(perStudentPrice);

    if (serviceCharge !== undefined && serviceCharge !== "")
      school.serviceCharge = Number(serviceCharge);

    if (gstServiceCharge !== undefined && gstServiceCharge !== "")
      school.gstServiceCharge = Number(gstServiceCharge);

    if (numberOfInstallments !== undefined && numberOfInstallments !== "")
      school.numberOfInstallments = Number(numberOfInstallments);

    // ✅ Update installments
    if (installments) {
      school.installments =
        typeof installments === "string" ? JSON.parse(installments) : installments;
    }

    // ✅ Hash new password if provided
    if (password) {
      school.password = await bcrypt.hash(password, 10);
    }

    const updatedSchool = await school.save();

    res.status(200).json({
      success: true,
      message: "School updated successfully",
      data: updatedSchool,
    });
  } catch (err) {
    console.error("Update school error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};
// Login School
exports.loginSchool = async (req, res) => {
  const { email, password, schoolCode } = req.body;

  try {
    const school = await School.findOne({ email, schoolCode });
    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: "School not found or invalid code" });
    }

    const isMatch = await bcrypt.compare(password, school.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: school._id,
        role: "school",
        schoolCode: school.schoolCode,
        color: school.color,
      },
      process.env.JWT_SECRET || "yoursecretkey",
      { expiresIn: "7d" }
    );

    const schoolData = school.toObject();
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: school._id,
        name: school.name,
        email: school.email,
        schoolCode: school.schoolCode,
        color: school.color,
        logoUrl: school.logoUrl,
        adminName: school.adminName,
        adminEmail: school.adminEmail,
        adminContact: school.adminContact,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify School Code for Mobile App (NEW ENDPOINT)
exports.verifySchoolCodeMobile = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    
    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: "School code is required"
      });
    }

    // Find school by schoolCode (case-insensitive) - NO FILTERS
    const school = await School.findOne({ 
      schoolCode: { $regex: new RegExp(`^${schoolCode}$`, 'i') }
    }).select("-password");

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Invalid school code"
      });
    }

    res.status(200).json({
      success: true,
      school: {
        _id: school._id,
        name: school.name,
        schoolCode: school.schoolCode,
        email: school.email,
        phone: school.phone,
        address: school.address,
        color: school.color,
        logoUrl: school.logoUrl,
        adminName: school.adminName,
        adminEmail: school.adminEmail,
        adminContact: school.adminContact
      }
    });
  } catch (error) {
    console.error("School code verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during school verification"
    });
  }
};

// Get All Schools
// ---------------- GET ALL SCHOOLS (with Pagination) ----------------
exports.getAllSchools = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = ""
    } = req.query;

    // Build search query
    let searchQuery = {
      isDefaultPricing: { $ne: true }
    };

    // Add search conditions if search term is provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // case-insensitive search
      searchQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { schoolCode: searchRegex },
        { address: searchRegex },
        { phone: searchRegex }
      ];
    }

    // ✅ Count total schools matching the search criteria
    const total = await School.countDocuments(searchQuery);

    // ✅ Fetch schools with pagination and search
    const schools = await School.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 }) // newest schools first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!schools || schools.length === 0) {
      return res.status(404).json({
        success: false,
        message: search ? "No schools found matching your search" : "No schools found",
      });
    }

    res.status(200).json({
      success: true,
      data: schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: parseInt(page) < Math.ceil(total / limit),
        hasPrev: parseInt(page) > 1,
        nextPage: parseInt(page) < Math.ceil(total / limit) ? parseInt(page) + 1 : null,
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null
      },
      search: search || "",
    });
  } catch (err) {
    console.error("Get all schools error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get All Schools for Super Admin (Simple List)
exports.getAllSchoolsSimple = async (req, res) => {
  try {
    const schools = await School.find({})
      .select("_id name schoolCode").sort({_id: -1});

    res.status(200).json({
      success: true,
      data: schools,
    });
  } catch (err) {
    console.error("Get all schools simple error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get School by ID
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).select("-password");
    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }
    res.status(200).json({ success: true, data: school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update School


// Delete School
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    if (school.logoUrl) {
      const logoPath = path.join(__dirname, "..", school.logoUrl);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }

    await School.deleteOne({ _id: req.params.id });
    res
      .status(200)
      .json({ success: true, message: "School deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload Logo
exports.uploadLogo = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Logo file is required" });
    }


    school.logoUrl = await uploadFile2(req.file, `logos`);


    school.color = req.body.color || school.color;
    await school.save();

    res.status(201).json({
      success: true,
      message: "Logo uploaded successfully",
      data: { logoUrl: school.logoUrl, color: school.color },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get Logo
exports.getLogo = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).select("logoUrl color");
    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }
    if (!school.logoUrl) {
      return res
        .status(404)
        .json({ success: false, message: "No logo found for this school" });
    }

    res.status(200).json({
      success: true,
      data: { logoUrl: school.logoUrl, color: school.color },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Logo
exports.updateLogo = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "New logo file is required" });
    }


    school.logoUrl = await uploadFile2(req.file, `logos`);
    school.color = req.body.color || school.color;
    await school.save();

    res.status(200).json({
      success: true,
      message: "Logo updated successfully",
      data: { logoUrl: school.logoUrl, color: school.color },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Logo
exports.deleteLogo = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school || school.isDefaultPricing) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }
    if (!school.logoUrl) {
      return res
        .status(404)
        .json({ success: false, message: "No logo found for this school" });
    }

    const logoPath = path.join(__dirname, "..", school.logoUrl);
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);

    school.logoUrl = null;
    await school.save();

    res
      .status(200)
      .json({ success: true, message: "Logo deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Default Pricing
exports.getDefaultPricing = async (req, res) => {
  try {
    let pricing = await School.findOne({ isDefaultPricing: true });
    if (!pricing) {
      // Create default pricing if none exists
      pricing = new School({
        name: "Default Pricing",
        email: "default@pricing.com",
        password: await bcrypt.hash("default123", 10),
        perStudentPrice: 1000,
        serviceCharge: 50,
        gstServiceCharge: 18,
        paymentMode: "Cash",
        isDefaultPricing: true,
        duration: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ),
      });
      await pricing.save();
    }
    res.status(200).json({
      success: true,
      data: {
        perStudentPrice: pricing.perStudentPrice,
        serviceCharge: pricing.serviceCharge,
        gstServiceCharge: pricing.gstServiceCharge,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Save Default Pricing
exports.saveDefaultPricing = async (req, res) => {
  try {
    const { perStudentPrice, serviceCharge, gstServiceCharge } = req.body;

    // Validate inputs
    if (isNaN(perStudentPrice) || perStudentPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Per Student Price must be a non-negative number.",
      });
    }
    if (isNaN(serviceCharge) || serviceCharge < 0) {
      return res.status(400).json({
        success: false,
        message: "Service Charge must be a non-negative number.",
      });
    }
    if (
      isNaN(gstServiceCharge) ||
      gstServiceCharge < 0 ||
      gstServiceCharge > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "GST Charge must be between 0 and 100.",
      });
    }

    let pricing = await School.findOne({ isDefaultPricing: true });
    if (pricing) {
      // Update existing
      pricing.perStudentPrice = perStudentPrice;
      pricing.serviceCharge = serviceCharge;
      pricing.gstServiceCharge = gstServiceCharge;
    } else {
      // Create new

      pricing = new School({
        name: "Default Pricing",
        email: "default@pricing.com",
        password: await bcrypt.hash("default123", 10),
        perStudentPrice,
        serviceCharge,
        gstServiceCharge,
        paymentMode: "Cash",
        isDefaultPricing: true,
        duration: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ),
      });
    }

    const updatedPricing = await pricing.save();
    res.status(200).json({
      success: true,
      message: "Default pricing settings saved successfully",
      data: {
        perStudentPrice: updatedPricing.perStudentPrice,
        serviceCharge: updatedPricing.serviceCharge,
        gstServiceCharge: updatedPricing.gstServiceCharge,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
