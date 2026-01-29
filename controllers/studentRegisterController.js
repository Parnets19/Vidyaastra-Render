const Student = require("../models/Student")



// Register a new student
exports.registerStudent = async (req, res) => {
  try {
    const { schoolId, ...rest } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      // MODIFIED: Add schoolId validation
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const newStudent = new Student({ ...rest, schoolId }) // MODIFIED: Add schoolId
    await newStudent.save()
    res.status(201).json({ success: true, message: "Student registered successfully", data: newStudent })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      // MODIFIED: Add schoolId validation
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const students = await Student.find({ schoolId: schoolId }) // MODIFIED: Filter by schoolId
    res.status(200).json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get a single student by ID
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      // MODIFIED: Add schoolId validation
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const student = await Student.findOne({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found or does not belong to this school" })
    }
    res.status(200).json({ success: true, data: student })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update student details
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, ...updateFields } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      // MODIFIED: Add schoolId validation
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true },
    )
    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: "Student not found or does not belong to this school" })
    }
    res.status(200).json({ success: true, message: "Student updated", data: updatedStudent })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      // MODIFIED: Add schoolId validation
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deletedStudent = await Student.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId
    if (!deletedStudent) {
      return res.status(404).json({ success: false, message: "Student not found or does not belong to this school" })
    }
    res.status(200).json({ success: true, message: "Student deleted" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
