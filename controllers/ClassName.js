const Class = require("../models/classmodel");
const Session = require("../models/Session");


exports.createClass = async (req, res) => {
  try {
    const { className, schoolId } = req.body;
    console.log(req.body);
    if (!className || !schoolId) {
        return res.status(400).json({ success: false, message: "Name and School ID are required." });
    }
    const newClass = new Class({ className, schoolId });
    await newClass.save();
    res.status(201).json({ success: true, message: "Class created successfully", data: newClass });
  } catch (error) {
    console.error("Create Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  } 
};
exports.getClasses = async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) {
            return res.status(400).json({ success: false, message: "School ID is required in query parameters." });
        }
        const classes = await Class.find({ schoolId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: classes.length, data: classes });
    } catch (error) {
        console.error("Get Classes Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }   
};


exports.createSession = async (req, res) => {
    try {
        const { name, schoolId } = req.body;    
        if (!name || !schoolId) {
            return res.status(400).json({ success: false, message: "Name and School ID are required." });
        }
        const newSession = new Session({ name, schoolId });
        await newSession.save();
        res.status(201).json({ success: true, message: "Session created successfully", data: newSession });
    } catch (error) {
        console.error("Create Session Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) {
            return res.status(400).json({ success: false, message: "School ID is required in query parameters." });
        }
        const sessions = await Session
            .find({ schoolId })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: sessions.length, data: sessions });
    } catch (error) {
        console.error("Get Sessions Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }       
};

exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: "Session not found" });
        await session.remove();
        res.status(200).json({ success: true, message: "Session deleted successfully" });
    } catch (error) {
        console.error("Delete Session Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const classItem = await Class.deleteOne({_id:req.params.id});
        if (!classItem) return res.status(404).json({ message: "Class not found" });
        // await classItem.remove();
        res.status(200).json({ success: true, message: "Class deleted successfully" });
    } catch (error) {
        console.error("Delete Class Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Update Class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, schoolId, classTeacher, students } = req.body;        
    if (!schoolId) {
        return res.status(400).json({ success: false, message: "School ID is required." });
    }
    const updatedClass = await Class.findOneAndUpdate(
      { _id: id, schoolId },
      { name },
      { new: true, runValidators: true }
    );
    if (!updatedClass) {
        return res.status(404).json({ success: false, message: "Class not found or does not belong to this school" });
    }
    res.status(200).json({ success: true, message: "Class updated successfully", data: updatedClass });
    } catch (error) {
    console.error("Update Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatedSession = async (req, res) => {
    try {
        const { id } = req.params;      
        const { name, schoolId } = req.body;
        if (!schoolId) {
            return res.status(400).json({ success: false, message: "School ID is required." });
        }
        const updatedSession = await Session.findOneAndUpdate(
            { _id: id, schoolId },
            { name },
            { new: true, runValidators: true }
        );      
        if (!updatedSession) {
            return res.status(404).json({ success: false, message: "Session not found or does not belong to this school" });
        }
        res.status(200).json({ success: true, message: "Session updated successfully", data: updatedSession });
    } catch (error) {
        console.error("Update Session Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }   
};


