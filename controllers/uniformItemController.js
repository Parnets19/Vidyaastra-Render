const UniformItem = require("../models/UniformItem")
const Class = require("../models/Class")
const path = require("path")
const fs = require("fs")
const { uploadFile2 } = require("../config/AWS")

// Ensure uploads/uniforms directory exists
const uniformsBaseDir = path.join(__dirname, "../uploads/uniforms")
if (!fs.existsSync(uniformsBaseDir)) {
  fs.mkdirSync(uniformsBaseDir, { recursive: true })
}

// MODIFIED: Simplified processing without sizes
const processItemForResponse = (item) => {
  try {
    const itemObj = item.toObject ? item.toObject() : item
    return {
      ...itemObj,
      // Remove any legacy size-related fields
      sizes: undefined,
      sizeDetails: undefined,
      totalStock: undefined,
    }
  } catch (error) {
    console.error("Error processing item:", item._id, error)
    return {
      _id: item._id,
      name: item.name || "Unknown Item",
      description: item.description || "No description",
      price: item.price || 0,
      imageUrl: item.imageUrl || "",
      classId: item.classId,
      stock: item.stock || 0,
      schoolId: item.schoolId,
    }
  }
}

// Get all uniform items - MODIFIED VERSION
exports.getAllUniformItems = async (req, res) => {
  try {
    const { schoolId, classId } = req.query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    console.log("Fetching uniform items for school:", schoolId, "class:", classId)

    // Build query object
    const query = { schoolId: schoolId }
    if (classId) {
      query.classId = classId
    }

    const items = await UniformItem.find(query)
      .populate('classId', 'className section')
      .select({
        name: 1,
        description: 1,
        price: 1,
        imageUrl: 1,
        classId: 1,
        stock: 1,
        createdAt: 1,
        updatedAt: 1,
        schoolId: 1,
      })

    console.log(`Found ${items.length} uniform items for school ${schoolId}`)

    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No uniform items found for this school/class",
      })
    }

    // Process each item
    const processedItems = items.map((item) => processItemForResponse(item))

    console.log("Successfully processed uniform items:", processedItems.length)

    res.status(200).json({
      success: true,
      count: processedItems.length,
      data: processedItems,
    })
  } catch (error) {
    console.error("Get uniform items error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch uniform items",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}

// Get single uniform item - MODIFIED VERSION
exports.getUniformItem = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Item ID is required",
      })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const item = await UniformItem.findOne({ _id: id, schoolId: schoolId })
      .populate('classId', 'className section')

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found or does not belong to this school",
      })
    }

    const processedItem = processItemForResponse(item)

    console.log("Fetched single uniform item:", {
      id: processedItem._id,
      name: processedItem.name,
      classId: processedItem.classId,
      price: processedItem.price,
      schoolId: processedItem.schoolId,
    })

    res.status(200).json({
      success: true,
      data: processedItem,
    })
  } catch (error) {
    console.error("Get uniform item error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch uniform item",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}

// Create uniform item - FIXED VERSION
exports.createUniformItem = async (req, res) => {
  try {
    console.log("=== CREATE UNIFORM ITEM DEBUG ===")
    console.log("Request body:", req.body)
    console.log("Request file:", req.file ? "File uploaded" : "No file")

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Image file is required",
      })
    }

    // Validate required fields
    const { name, description, price, classId, schoolId, stock } = req.body

    console.log("Extracted fields:", { name, description, price, classId, schoolId, stock })

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    if (!classId) {
      return res.status(400).json({ success: false, message: "Class ID is required." })
    }

    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        error: "Name, description, and price are required",
      })
    }

    // FIXED: Better class verification with null/undefined handling
    console.log("Verifying class exists...")
    console.log("Looking for class with ID:", classId)
    console.log("In school with ID:", schoolId)

    try {
      // First, let's check if the class exists at all
      const classExists = await Class.findById(classId)
      console.log("Class found by ID:", classExists ? "Yes" : "No")
      
      if (classExists) {
        console.log("Class details:", {
          _id: classExists._id,
          className: classExists.className,
          schoolId: classExists.schoolId,
          section: classExists.section
        })

        // FIXED: Handle undefined/null schoolId properly
        if (!classExists.schoolId) {
          return res.status(400).json({
            success: false,
            error: `Class "${classExists.className}" (${classId}) does not have a school assigned. Please update the class to assign it to a school first.`,
            debug: {
              classId: classId,
              className: classExists.className,
              classSchoolId: classExists.schoolId,
              providedSchoolId: schoolId,
              issue: "Class schoolId is null/undefined"
            }
          })
        }

        // Now safely compare schoolIds
        const classSchoolIdStr = classExists.schoolId.toString()
        const providedSchoolIdStr = schoolId.toString()
        
        console.log("Class schoolId matches provided schoolId:", 
          classSchoolIdStr === providedSchoolIdStr)

        if (classSchoolIdStr !== providedSchoolIdStr) {
          return res.status(404).json({
            success: false,
            error: `Class "${classExists.className}" (${classId}) belongs to a different school. Class belongs to school: ${classSchoolIdStr}, but you provided: ${providedSchoolIdStr}`,
            debug: {
              classId: classId,
              className: classExists.className,
              classSchoolId: classSchoolIdStr,
              providedSchoolId: providedSchoolIdStr,
              match: false
            }
          })
        }
      } else {
        return res.status(404).json({
          success: false,
          error: `Class with ID ${classId} does not exist`,
          debug: {
            classId: classId,
            schoolId: schoolId
          }
        })
      }

      console.log("Class verification successful!")

    } catch (classError) {
      console.error("Error during class verification:", classError)
      return res.status(500).json({
        success: false,
        error: "Error verifying class information",
        details: classError.message
      })
    }

    // Create school-specific directory for uploads
    const uniformsSchoolDir = path.join(uniformsBaseDir, schoolId)
    if (!fs.existsSync(uniformsSchoolDir)) {
      fs.mkdirSync(uniformsSchoolDir, { recursive: true })
    }

    // Construct imageUrl based on the uploaded file and schoolId
    const imageUrl = await uploadFile2(req.file, `uniforms/${schoolId}`)

    // Create item data
    const itemData = {
      name: name.trim(),
      description: description.trim(),
      price: Number.parseFloat(price),
      imageUrl: imageUrl,
      classId: classId,
      stock: Number.parseInt(stock) || 0,
      schoolId: schoolId,
    }

    console.log("Creating uniform item with data:", itemData)

    const item = await UniformItem.create(itemData)

    // Populate the class information
    await item.populate('classId', 'className section')

    console.log("Created uniform item successfully:", {
      id: item._id,
      name: item.name,
      classId: item.classId,
      price: item.price,
      imageUrl: item.imageUrl,
      schoolId: item.schoolId,
    })

    res.status(201).json({
      success: true,
      message: "Uniform item created successfully",
      data: item,
    })
  } catch (error) {
    console.error("Create uniform item error:", error)

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      })
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Uniform item with this name already exists for this class",
      })
    }

    res.status(500).json({
      success: false,
      error: "Failed to create uniform item",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}

// Update uniform item - MODIFIED VERSION
exports.updateUniformItem = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, classId } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Item ID is required",
      })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    // Check if item exists and belongs to the school
    const existingItem = await UniformItem.findOne({ _id: id, schoolId: schoolId })
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: "Item not found or does not belong to this school",
      })
    }

    // If classId is being updated, verify it exists and belongs to the school
    if (classId && classId !== existingItem.classId.toString()) {
      const classExists = await Class.findById(classId)
      
      if (!classExists) {
        return res.status(404).json({
          success: false,
          error: "Class not found",
        })
      }

      // FIXED: Handle undefined/null schoolId in class
      if (!classExists.schoolId) {
        return res.status(400).json({
          success: false,
          error: `Class "${classExists.className}" does not have a school assigned`,
        })
      }

      if (classExists.schoolId.toString() !== schoolId.toString()) {
        return res.status(404).json({
          success: false,
          error: "Class does not belong to this school",
        })
      }
    }

    // Construct update data
    const updateData = {}

    if (req.body.name) updateData.name = req.body.name.trim()
    if (req.body.description) updateData.description = req.body.description.trim()
    if (req.body.price) updateData.price = Number.parseFloat(req.body.price)
    if (classId) updateData.classId = classId
    if (req.body.stock !== undefined) updateData.stock = Number.parseInt(req.body.stock) || 0

    // Update imageUrl if a new file is uploaded
    if (req.file) {
      updateData.imageUrl =await uploadFile2(req.file, `uniforms/${schoolId}`)

      // Optionally delete old image file
      if (existingItem.imageUrl) {
        const oldImagePath = path.join(uniformsBaseDir, schoolId, path.basename(existingItem.imageUrl))
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath)
          } catch (deleteError) {
            console.warn("Could not delete old image:", deleteError.message)
          }
        }
      }
    }

    const item = await UniformItem.findByIdAndUpdate(
      { _id: id, schoolId: schoolId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate('classId', 'className section')

    console.log("Updated uniform item:", {
      id: item._id,
      name: item.name,
      classId: item.classId,
      price: item.price,
      imageUrl: item.imageUrl,
      schoolId: item.schoolId,
    })

    res.status(200).json({
      success: true,
      message: "Uniform item updated successfully",
      data: item,
    })
  } catch (error) {
    console.error("Update uniform item error:", error)

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      })
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Uniform item with this name already exists for this class",
      })
    }

    res.status(500).json({
      success: false,
      error: "Failed to update uniform item",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}

// Delete uniform item - SAME AS BEFORE
exports.deleteUniformItem = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Item ID is required",
      })
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const item = await UniformItem.findByIdAndDelete({ _id: id, schoolId: schoolId })

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found or does not belong to this school",
      })
    }

    // Delete the associated image file
    if (item.imageUrl) {
      const imagePath = path.join(uniformsBaseDir, schoolId, path.basename(item.imageUrl))
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath)
        } catch (deleteError) {
          console.warn("Could not delete image file:", deleteError.message)
        }
      }
    }

    console.log("Deleted uniform item:", item.name)

    res.status(200).json({
      success: true,
      message: "Uniform item deleted successfully",
      data: {},
    })
  } catch (error) {
    console.error("Delete uniform item error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to delete uniform item",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}



// Get all uniform items for a school (ignores classId, gets everything for the school)
exports.getAllUniformItemsBySchool = async (req, res) => {
  try {
    const { schoolId, search, sort, page = 1, limit = 10 } = req.query

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters."
      })
    }

    console.log("Getting ALL uniform items for school:", schoolId)

    const query = { schoolId: schoolId }

    // 🔎 Search functionality
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // ↕️ Sorting
    const sortOption = {}
    if (sort === "price-low") {
      sortOption.price = 1
    } else if (sort === "price-high") {
      sortOption.price = -1
    } else if (sort === "newest") {
      sortOption.createdAt = -1
    } else {
      sortOption.name = 1 // Default sort
    }

    // 📊 Pagination setup
    const pageNum = Number(page) || 1
    const limitNum = Number(limit) || 10
    const skip = (pageNum - 1) * limitNum

    // 📦 Total count before pagination
    const total = await UniformItem.countDocuments(query)

    // 📥 Fetch paginated items
    const items = await UniformItem.find(query)
      .populate("classId", "className section")
      .select({
        name: 1,
        description: 1,
        price: 1,
        imageUrl: 1,
        classId: 1,
        stock: 1,
        createdAt: 1,
        updatedAt: 1,
        schoolId: 1,
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)

    console.log(`Found ${items.length} uniform items for school ${schoolId}`)

    const processedItems = items.map((item) => processItemForResponse(item))

    res.status(200).json({
      success: true,
      count: processedItems.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: processedItems,
    })
  } catch (error) {
    console.error("Get all uniform items by school error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch uniform items",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}


// Get all uniform items unfiltered - MODIFIED VERSION
exports.getAllUniformItemsUnfiltered = async (req, res) => {
  try {
    const items = await UniformItem.find({})
      .populate('classId', 'className section')
      .select({
        name: 1,
        description: 1,
        price: 1,
        imageUrl: 1,
        classId: 1,
        stock: 1,
        createdAt: 1,
        updatedAt: 1,
        schoolId: 1,
      })

    const processedItems = items.map((item) => processItemForResponse(item))

    res.status(200).json({
      success: true,
      count: processedItems.length,
      data: processedItems,
    })
  } catch (error) {
    console.error("Get all uniform items unfiltered error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch all uniform items (unfiltered)",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
}
