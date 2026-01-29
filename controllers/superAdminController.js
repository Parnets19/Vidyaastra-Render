const SuperAdmin = require("../models/SuperAdmin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 🔐 Register Super Admin (once or via seed script)
exports.registerSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await SuperAdmin.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Super Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new SuperAdmin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    res
      .status(201)
      .json({ success: true, message: "Super Admin created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔐 Login Super Admin
exports.loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Super Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "superadmin" },
      process.env.JWT_SECRET || "yoursecretkey",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
