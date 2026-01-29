const Category = require("../models/Category")


// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const categories = await Category.find({ schoolId: schoolId }).sort({ name: 1 }) // MODIFIED: Filter by schoolId
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const existingCategory = await Category.findOne({ name, schoolId: schoolId }) // MODIFIED: Check for existing category within the school
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists for this school" })
    }

    const category = new Category({
      name,
      description,
      schoolId, // MODIFIED: Add schoolId
    })

    const newCategory = await category.save()
    res.status(201).json(newCategory)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      { name, description },
      { new: true },
    )

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found or does not belong to this school" })
    }
    res.json(updatedCategory)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const category = await Category.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId
    if (!category) {
      return res.status(404).json({ message: "Category not found or does not belong to this school" })
    }
    res.json({ message: "Category deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}


exports.getAllCategoriesUnfiltered = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}