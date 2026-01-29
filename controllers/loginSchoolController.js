
exports.loginSchool = async (req, res) => {
  const { email, password, schoolCode } = req.body;

  try {
    const school = await school.findOne({ email, schoolCode });

    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found or school code is incorrect' });
    }

    if (school.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: school._id,
        name: school.name,
        email: school.email,
        schoolCode: school.schoolCode
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
