// controllers/SubjectController.js

const mongoose = require("mongoose");
const School = require("../models/School");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const SubjectModel = require("../models/SubjectModel");

/**
 * CREATE SUBJECT (schoolId from params, classId from body)
 */
const createSubject = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { subjectName, classId } = req.body;

    if (!subjectName || !schoolId ) {
      return res.status(400).json({
        success: false,
        message: "subjectName, classId and schoolId are required",
      });
    }

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(schoolId) ) {
      return res.status(400).json({
        success: false,
        message: "Invalid schoolId ",
      });
    }

    // Validate School
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    // Validate Class
    // const classData = await Class.findOne({ _id: classId, schoolId });
    // if (!classData) {
    //   return res.status(404).json({ success: false, message: "Class not found in this school" });
    // }

    // Check duplicate subject in the same class
    const existing = await SubjectModel.findOne({
      SubjectName: subjectName.trim(),
   
      schoolId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This subject already exists in this class",
      });
    }

    const subject = new SubjectModel({
      SubjectName: subjectName.trim(),
   
      schoolId,
    });

    await subject.save();

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Create Subject Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET SUBJECTS BY SCHOOL (schoolId from params)
 */
const getSubjectsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "schoolId is required" });
    }

    const subjects = await Subject.find({ schoolId })
      // .populate("classId", "className section")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error("Get Subjects Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL SUBJECTS (schoolId + classId from params)
 */
const getAllSubjects = async (req, res) => {
  try {
    const { schoolId, classId } = req.params;

    let query = { schoolId };
    // if (classId) query.classId = classId;

    const subjects = await SubjectModel.find(query)
      // .populate("classId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error("Get All Subjects Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE SUBJECT (schoolId + subjectId from params)
 */
const updateSubject = async (req, res) => {
  try {
    const { schoolId, subjectId } = req.params;
    const { subjectName } = req.body;

    // if (!subjectName) {
    //   return res.status(400).json({ success: false, message: "subjectName is required" });
    // }

    const subject = await SubjectModel.findOne({ _id: subjectId, schoolId });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found in this school" });
    }

    if(subjectName){
       subject.SubjectName =subjectName.trim();
    }
   
    await subject.save();

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE SUBJECT (schoolId + subjectId from params)
 */
const deleteSubject = async (req, res) => {
  try {
    const { schoolId, subjectId } = req.params;

    const subject = await SubjectModel.findOne({ _id: subjectId, schoolId });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found in this school" });
    }

    await SubjectModel.deleteOne({ _id: subjectId, schoolId });

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subject Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSubject,
  getSubjectsBySchool,
  getAllSubjects,
  updateSubject,
  deleteSubject,
};
