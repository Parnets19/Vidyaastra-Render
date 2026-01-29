const Student = require("../models/Student");
const Class = require("../models/Class");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const School = require("../models/School");
const mongoose = require('mongoose');

const { uploadFile2 } = require("../config/AWS");

// FIXED: Get Student Profile - Updated to include section information
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("classId", "className section classTeacher") // FIXED: Added 'section' and 'classTeacher'
      .populate("schoolId");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FIXED: Update Student Profile - Updated to include section information
exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    let updateFields = { ...req.body };

    // ✅ Handle password update safely
    if (updateFields.password && updateFields.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(updateFields.password, salt);
    } else {
      await
        // prevent overwriting with empty string
        delete updateFields.password;
    }


    if (req.file) {
      updateFields.profileImage = await uploadFile2(req.file, "students");
    }


    // ✅ Perform update
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate("classId", "className section classTeacher")
      .populate("schoolId");

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    console.log(updatedStudent, "updatedStudent");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map(
        (key) => error.errors[key].message
      );
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// FIXED: Get All Students - Updated to include section information
exports.getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      schoolId = '',
      classId = '',
      gender = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build search query
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { motherName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by school
    if (schoolId) {
      query.schoolId = schoolId;
    }

    // Filter by class
    if (classId) {
      query.classId = classId;
    }

    // Filter by gender
    if (gender) {
      query.gender = gender;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const totalStudents = await Student.countDocuments(query);

    // Get students with pagination
    const students = await Student.find(query)
      .populate("classId", "className section classTeacher")
      .populate("schoolId")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // Calculate pagination info
    const totalPages = Math.ceil(totalStudents / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      students,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalStudents,
        studentsPerPage: limitNumber,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        prevPage: hasPrevPage ? pageNumber - 1 : null
      }
    });
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getStudentsBySchoolId = async (req, res) => {
  try {
    const { schoolId } = req.params;
    let { 
      page = 1, 
      limit = 10, 
      name = "", 
      className = "", 
      section = "" 
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Validate school ID
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required"
      });
    }

    // Build the aggregation pipeline
    const pipeline = [
      // Match students by school and name filter
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          ...(name && name.trim() && {
            $or: [
              { name: { $regex: name.trim(), $options: "i" } },
              { rollNumber: { $regex: name.trim(), $options: "i" } },
              { studentId: { $regex: name.trim(), $options: "i" } },
              { email: { $regex: name.trim(), $options: "i" } }
            ]
          })
        }
      },
      // Lookup class information
      {
        $lookup: {
          from: "classes", // Collection name for classes
          localField: "classId",
          foreignField: "_id",
          as: "classInfo"
        }
      },
      // Unwind class info (optional, for easier processing)
      {
        $unwind: {
          path: "$classInfo",
          preserveNullAndEmptyArrays: true // Keep students without classes
        }
      },
      // Add class and section fields
      {
        $addFields: {
          className: { $ifNull: ["$classInfo.className", "Unassigned"] },
          section: { $ifNull: ["$classInfo.section", "N/A"] }
        }
      },
      // Apply class name filter
      ...(className && className.trim() !== "" && [
        {
          $match: {
            className: className.trim()
          }
        }
      ]),
      // Apply section filter
      ...(section && section.trim() !== "" && [
        {
          $match: {
            section: section.trim()
          }
        }
      ]),
      // Group back to get count for pagination
      {
        $facet: {
          // Data facet for paginated results
          data: [
            { $sort: { createdAt: -1, name: 1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
              $lookup: {
                from: "classes",
                localField: "classId",
                foreignField: "_id",
                as: "classId"
              }
            },
            {
              $unwind: {
                path: "$classId",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: "schools",
                localField: "schoolId",
                foreignField: "_id",
                as: "schoolId"
              }
            },
            {
              $unwind: {
                path: "$schoolId",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                rollNumber: 1,
                studentId: 1,
                dob: 1,
                gender: 1,
                address: 1,
                phone: 1,
                email: 1,
                fatherName: 1,
                motherName: 1,
                parentPhone: 1,
                profileImage: 1,
                classId: {
                  _id: "$classId._id",
                  className: "$classId.className",
                  section: "$classId.section",
                  classTeacher: "$classId.classTeacher"
                },
                schoolId: {
                  _id: "$schoolId._id",
                  name: "$schoolId.name"
                },
                createdAt: 1,
                updatedAt: 1,
                className: 1,
                section: 1
              }
            }
          ],
          // Count facet for total count
          count: [
            { $count: "totalStudents" }
          ]
        }
      }
    ];

    // console.log("Student aggregation pipeline:", JSON.stringify(pipeline, null, 2));

    // Execute aggregation
    const result = await Student.aggregate(pipeline);

    // Extract data and count
    const paginatedStudents = result[0].data || [];
    const totalStudentsResult = result[0].count[0] || { totalStudents: 0 };
    const totalStudents = totalStudentsResult.totalStudents || 0;

    // Calculate pagination info
    const totalPages = Math.ceil(totalStudents / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Format the response data
    const formattedStudents = paginatedStudents.map(student => ({
      ...student,
      id: student._id.toString(),
      _id: undefined, // Remove _id from main object since we have id
      className: student.className || student.classId?.className || "Unassigned",
      section: student.section || student.classId?.section || "N/A",
      classTeacher: student.classId?.classTeacher || null,
      schoolName: student.schoolId?.name || "Unknown School"
    }));

    res.status(200).json({
      success: true,
      message: `Successfully fetched ${formattedStudents.length} students`,
      count: formattedStudents.length,
      totalStudents,
      totalPages,
      currentPage: pageNum,
      data: formattedStudents,
      filters: {
        name: name || "",
        className: className || "",
        section: section || ""
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        skip: skip,
        total: totalStudents,
        totalPages: totalPages,
        hasNext: hasNext,
        hasPrev: hasPrev
      }
    });

  } catch (error) {
    console.error("Get students by school ID error:", {
      error: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


// Export students endpoint
exports.exportStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    let { 
      limit = 10000, 
      name = "", 
      className = "", 
      section = "" 
    } = req.query;

    // Parse limit
    limit = parseInt(limit) || 10000;

    // Build query object (same as getStudentsBySchoolId)
    const query = { schoolId };

    // Apply filters
    if (name && name.trim()) {
      query.$or = [
        { name: { $regex: name.trim(), $options: "i" } },
        { rollNumber: { $regex: name.trim(), $options: "i" } },
        { studentId: { $regex: name.trim(), $options: "i" } },
        { email: { $regex: name.trim(), $options: "i" } }
      ];
    }

    if (className && className.trim() !== "") {
      query["classId.className"] = className.trim();
    }

    if (section && section.trim() !== "") {
      query["classId.section"] = section.trim();
    }

    console.log("Export query:", JSON.stringify(query, null, 2));

    // Fetch all matching students with population
    const students = await Student.find(query)
      .populate({
        path: "classId",
        select: "className section"
      })
      .populate("schoolId", "name schoolCode")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format export data
    const exportData = students.map(student => ({
      name: student.name || "",
      className: student.classId?.className || "Unassigned",
      section: student.classId?.section || "N/A",
      rollNumber: student.rollNumber || "",
      studentId: student.studentId || "",
      dob: student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : "",
      gender: student.gender || "",
      email: student.email || "",
      phone: student.phone || "",
      address: student.address || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      parentPhone: student.parentPhone || "",
      schoolName: student.schoolId?.name || "",
      schoolCode: student.schoolId?.schoolCode || ""
    }));

    res.status(200).json({
      success: true,
      message: `Successfully prepared ${exportData.length} students for export`,
      data: exportData,
      filters: {
        name: name || "",
        className: className || "",
        section: section || ""
      },
      totalExported: exportData.length
    });

  } catch (error) {
    console.error("Export students error:", {
      error: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: "Server error while preparing export data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      schoolId = '',
      gender = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build query
    let query = { classId };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { motherName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by school if provided
    if (schoolId) {
      query.schoolId = schoolId;
    }

    // Filter by gender if provided
    if (gender) {
      query.gender = gender;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const totalStudents = await Student.countDocuments(query);

    // Get students
    const students = await Student.find(query)
      .populate("classId", "className section classTeacher")
      .populate("schoolId")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // Calculate pagination info
    const totalPages = Math.ceil(totalStudents / limitNumber);

    res.status(200).json({
      students,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalStudents,
        studentsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
        prevPage: pageNumber > 1 ? pageNumber - 1 : null
      }
    });
  } catch (error) {
    console.error('Error in getStudentsByClass:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getStudentsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      classId = '',
      gender = '',
      sortBy = 'name',
      sortOrder = 'asc',

    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build query
    let query = { schoolId };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { motherName: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by class if provided
    if (classId) {
      query.classId = classId;
    }

    // Filter by gender if provided
    if (gender) {
      query.gender = gender;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const totalStudents = await Student.countDocuments(query);

    // Get students
    const students = await Student.find(query)
      .populate("classId", "className section classTeacher")
      .populate("schoolId")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // Calculate pagination info
    const totalPages = Math.ceil(totalStudents / limitNumber);

    res.status(200).json({
      students,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalStudents,
        studentsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
        prevPage: pageNumber > 1 ? pageNumber - 1 : null
      }
    });
  } catch (error) {
    console.error('Error in getStudentsBySchool:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getStudentStats = async (req, res) => {
  try {
    const { schoolId } = req.query;

    // Validate schoolId if provided
    if (schoolId && !mongoose.isValidObjectId(schoolId)) {
      return res.status(400).json({ message: 'Invalid schoolId format' });
    }

    // Build query object
    let query = {};
    if (schoolId) {
      query.schoolId = new mongoose.Types.ObjectId(schoolId); // Cast to ObjectId
    }

    // Get total students
    const totalStudents = await Student.countDocuments(query);

    // Get gender breakdown (male and female counts)
    const genderStats = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total classes (unique classIds for the school)
    const totalClasses = await Student.distinct('classId', query).then(distinctClasses => distinctClasses.length);

    // Parse gender stats
    const maleCount = genderStats.find(stat => stat._id === 'Male')?.count || 0;
    const femaleCount = genderStats.find(stat => stat._id === 'Female')?.count || 0;

    res.status(200).json({
      totalStudents,
      totalClasses,
      maleCount,
      femaleCount,
      // Optional: Include other stats if needed (e.g., average age, etc.)
    });
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSchoolsWithStudentCounts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 9,
      search = '',
      dateRange = '',
      id = ""
    } = req.query;
    let matchQuery = {};
    if (id) {
      page = 1;
      matchQuery._id = new mongoose.Types.ObjectId(id);
    }
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;


    if (search) {
      matchQuery.name = { $regex: search, $options: 'i' };
    }


    // Add dateRange filter
    if (dateRange) {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          matchQuery.createdAt = { $gte: startDate };
          break;
        case 'lastWeek':
          startDate = new Date(now.setDate(now.getDate() - 7));
          matchQuery.createdAt = { $gte: startDate };
          break;
        case 'lastMonth':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          matchQuery.createdAt = { $gte: startDate };
          break;
        default:
          break;
      }
    }

    const schoolsAggregate = await School.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'schoolId',
          as: 'students',
        },
      },
      {
        $addFields: {
          studentCount: { $size: '$students' },
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          address: 1,
          phone: 1,
          studentCount: 1,
          schoolCode: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limitNumber,
      },
    ]);

    const totalSchools = await School.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalSchools / limitNumber);

    res.status(200).json({
      schools: schoolsAggregate,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalSchools,
        schoolsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
        prevPage: pageNumber > 1 ? pageNumber - 1 : null,
      },
    });
  } catch (error) {
    console.error('Error in getSchoolsWithStudentCounts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.getClassesWithStudentCounts = async (req, res) => {
  try {
    const { schoolId } = req.query;

    // Validate schoolId
    if (schoolId && !mongoose.isValidObjectId(schoolId)) {
      return res.status(400).json({ message: 'Invalid schoolId format' });
    }

    let matchQuery = {};
    if (schoolId) {
      matchQuery.schoolId = new mongoose.Types.ObjectId(schoolId);
    }

    const classes = await Class.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'classId',
          as: 'students',
        },
      },
      {
        $addFields: {
          studentCount: { $size: '$students' },
          maleCount: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $eq: ['$$this.gender', 'Male'] },
              },
            },
          },
          femaleCount: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $eq: ['$$this.gender', 'Female'] },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'schools',
          localField: 'schoolId',
          foreignField: '_id',
          as: 'school',
        },
      },
      {
        $unwind: {
          path: '$school',
          preserveNullAndEmptyArrays: true, // Handle cases where schoolId has no matching school
        },
      },
      {
        $project: {
          id: '$_id',
          name: {
            $concat: ['$className', ' ', { $ifNull: ['$section', ''] }],
          },
          className: 1,
          section: 1,
          classTeacher: 1,
          capacity: 1,
          studentCount: 1,
          maleCount: 1,
          femaleCount: 1,
          school: {
            name: 1,
            code: 1,
          },
        },
      },
      {
        $sort: { className: 1, section: 1 },
      },
    ]);

    res.status(200).json(classes);
  } catch (error) {
    console.error('Error in getClassesWithStudentCounts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate("classId", "className section classTeacher")
      .populate("schoolId");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// NEW: Get Class Details - Separate endpoint for fetching complete class information
exports.getClassDetails = async (req, res) => {
  try {
    const { schoolId, classId } = req.params;

    if (!classId) {
      return res
        .status(400)
        .json({ success: false, message: "Class ID is required." });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found." });
    }

    // ✅ Verify school access
    if (schoolId && classData.schoolId.toString() !== schoolId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Get class details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Keep all other methods unchanged
exports.createStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ message: "Missing form data in request body" });
    }

    const {
      name,
      classId,
      rollNumber,
      studentId,
      dob,
      gender,
      address,
      phone,
      email,
      password,
      fatherName,
      motherName,
      parentPhone,
      schoolId,
      classN,
      section,
    } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for student creation.",
      });
    }

    // Validate schoolId and check student limit
    const school = await School.findById(schoolId).session(session);
    if (!school) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    // If no seats left
    if (school.totalStudent <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot add more students. The school has no available seats left.`,
      });
    }

    const existingStudent = await Student.findOne({
      rollNumber,
    }).session(session);
    if (existingStudent) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student roll number already exists.",
      });
    }
    const existingStudentId = await Student.findOne({
      studentId,
    }).session(session);
    if (existingStudentId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student ID already exists.",
      });
    }

    const exiztingPhone = await Student.findOne({
      phone,
    }).session(session);
    if (exiztingPhone) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student phone number already exists.",
      });
    }

    const existingEmail = await Student.findOne({
      email,
    }).session(session);
    if (existingEmail) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student email already exists.",
      });
    }


    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile image upload
    let profileImagePath = "";
    if (req.file) {
      try {
        profileImagePath = await uploadFile2(req.file, "students");
      } catch (fileError) {
        console.error("File upload error:", fileError);
      }
    }

    // Create new student
    const newStudent = new Student({
      name,
      classId,
      rollNumber,
      studentId,
      dob,
      gender,
      address,
      phone,
      email,
      password: hashedPassword,
      fatherName,
      motherName,
      parentPhone,
      schoolId,
      profileImage: profileImagePath,classN,
      section,
    });

    // Save student with session
    await newStudent.save({ session });

    // Decrease available seats (totalStudent) by 1
    await School.findByIdAndUpdate(
      schoolId,
      { $inc: { totalStudent: -1 } },
      { session, new: true }
    );

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create student error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map(
        (key) => error.errors[key].message
      );
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
      });
    }

    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  } finally {
    session.endSession(); // always close session
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Please upload a file" });


    const newProfileImage = await uploadFile2(req.file, "students");

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: { profileImage: newProfileImage } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      filePath: updatedStudent.profileImage,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.deleteProfileImage = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });



    student.profileImage = "";
    await student.save();

    res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
      student,
    });
  } catch (error) {
    console.error("Delete profile image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentId } = req.params;
    const { id } = req.params; // studentId from URL
    const { schoolId } = req.body; // schoolId from body
    console.log("Delete student request:", { id, schoolId });
    console.log("Delete student request:", { studentId, schoolId });

    // Validate required fields
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Student ID is required in URL." });
    }

    if (!schoolId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "School ID is required in body." });
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(schoolId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID or School ID format.",
      });
    }

    // Find student
    const student = await Student.findOne({ _id: id, schoolId }).session(
      session
    );
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Student not found or does not belong to this school",
      });
    }

    // Delete profile image if exists
    if (student.profileImage) {
      const imagePath = path.join(__dirname, "..", student.profileImage);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (fileError) {
          console.error("Error deleting profile image:", fileError);
        }
      }
    }

    // Delete student
    await Student.deleteOne({ _id: id, schoolId }).session(session);

    // Decrement school's current student count
    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        $inc: {
          currentStudentCount: -1, // one student less currently
          totalStudent: 1, // one more added to total history
        },
      },
      { session, new: true }
    );

    if (!school) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      school,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
// Get Students by Class Name
exports.getStudentsByClassName = async (req, res) => {
  try {
    const { className } = req.params;
    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Class name is required in URL.",
      });
    }

    // Find the class by name
    const classData = await Class.findOne({ className });
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found with this name.",
      });
    }

    // Find students belonging to this class
    const students = await Student.find({ classId: classData._id })
      .populate("classId", "className section classTeacher")
      .populate("schoolId")
      .sort({ createdAt: -1 });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found in class ${className}.`,
      });
    }

    res.status(200).json({
      success: true,
      count: students.length,
      class: classData.className,
      data: students,
    });
  } catch (error) {
    console.error("Get students by class name error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


exports.bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "Students array is required" });
    }

    const createdStudents = await Student.insertMany(students, { ordered: false });

    res.status(201).json({
      message: `${createdStudents.length} students created successfully`,
      students: createdStudents
    });
  } catch (error) {
    console.error('Error in bulkCreateStudents:', error);
    res.status(400).json({ message: "Error creating students", error: error.message });
  }
};

exports.bulkUpdateStudents = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Updates array is required" });
    }

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { ...update.data, updatedAt: new Date() }
      }
    }));

    const result = await Student.bulkWrite(bulkOps);

    res.status(200).json({
      message: `${result.modifiedCount} students updated successfully`,
      result
    });
  } catch (error) {
    console.error('Error in bulkUpdateStudents:', error);
    res.status(400).json({ message: "Error updating students", error: error.message });
  }
};