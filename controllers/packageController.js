const Package = require("../models/Package")



// Create
exports.createPackage = async (req, res) => {
  try {
    const { schoolId, ...rest } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const newPackage = new Package({ ...rest, schoolId }) // MODIFIED: Add schoolId
    await newPackage.save()
    res.status(201).json({ success: true, data: newPackage })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Package with this name already exists for this school",
      })
    }
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get All
exports.getAllPackages = async (req, res) => {
  try {
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const packages = await Package.find({ schoolId: schoolId }) // MODIFIED: Filter by schoolId
    res.json({ success: true, data: packages })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get One
exports.getPackageById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const pkg = await Package.findById({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (!pkg)
      return res.status(404).json({ success: false, message: "Package not found or does not belong to this school" })
    res.json({ success: true, data: pkg })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// Update
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, ...updateFields } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updated = await Package.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true },
    )
    if (!updated)
      return res.status(404).json({ success: false, message: "Package not found or does not belong to this school" })
    res.json({ success: true, data: updated })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Package with this name already exists for this school",
      })
    }
    res.status(500).json({ success: false, error: err.message })
  }
}

// Delete
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deleted = await Package.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId
    if (!deleted)
      return res.status(404).json({ success: false, message: "Package not found or does not belong to this school" })
    res.json({ success: true, message: "Package deleted successfully" })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
