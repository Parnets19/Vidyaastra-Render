const mongoose = require("mongoose");
const Book = require("../models/Book");
const Class = require("../models/Class"); // MODIFIED: Import Class model
const { uploadFile2 } = require("../config/AWS");

exports.getAllBooks = async (req, res) => {
  try {
    const { classId, search, sort, schoolId } = req.query; // MODIFIED: Changed 'category' to 'classId'
    const query = {};

    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }
    query.schoolId = schoolId;

    if (classId) {
      // MODIFIED: Filter by classId
      // Validate if classId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid class ID format." });
      }
      const classDoc = await Class.findById({
        _id: classId,
        schoolId: schoolId,
      }); // MODIFIED: Find class by ID and schoolId
      if (classDoc) {
        query.classId = classDoc._id; // MODIFIED: Assign classId
      } else {
        return res.json({
          success: true,
          data: [],
          message: "No books found for this class.",
        }); // Return empty if class not found
      }
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const sortOption = {};
    if (sort === "price-low") {
      sortOption.price = 1;
    } else if (sort === "price-high") {
      sortOption.price = -1;
    } else if (sort === "newest") {
      sortOption.createdAt = -1;
    }

    // MODIFIED: Populate classId instead of category
    const books = await Book.find(query)
      .populate("classId", "className section")
      .sort(sortOption);
    res.json({ success: true, data: books }); // Wrap in success object
  } catch (err) {
    console.error("Get all books error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Get a single book by ID
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query;

    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }

    // MODIFIED: Populate classId instead of category
    const book = await Book.findById({ _id: id, schoolId: schoolId }).populate(
      "classId",
      "className section"
    );
    if (!book) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Book not found or does not belong to this school",
        });
    }
    res.json({ success: true, data: book }); // Wrap in success object
  } catch (err) {
    console.error("Get book by ID error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Create a new book
exports.createBook = async (req, res) => {
  try {
    console.log("Received request body:", req.body); // Debugging log
    console.log("Received file:", req.file); // Debugging log

    // Destructure 'classId' instead of 'category'
    const { title, author, price, classId, description, stock, schoolId } =
      req.body; // MODIFIED: Changed 'category' to 'classId'

    // Validate required fields
    if (
      !title ||
      !author ||
      !price ||
      !classId ||
      !description ||
      stock === undefined ||
      !schoolId
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "All fields including classId and schoolId are required",
        });
    }

    // Validate class exists for this school
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid class ID format" });
    }
    const classExists = await Class.findOne({
      _id: classId,
      schoolId: schoolId,
    }); // MODIFIED: Find class by ID and schoolId
    if (!classExists) {
      return res
        .status(400)
        .json({ success: false, message: "Class not found for this school" });
    }

    // Validate price and stock
    if (price < 0 || stock < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Price and stock must be positive numbers",
        });
    }

    // Validate image file
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required" });
    }

    // Get the file path for the uploaded image
    const imagePath = await uploadFile2(req.file, `books/${schoolId}`)

    // Create the book
    const book = new Book({
      title,
      author,
      price,
      classId: classId, // Assign the correctly destructured 'classId' to the 'classId' field in the schema
      image: imagePath,
      description,
      stock,
      schoolId,
    });

    const newBook = await book.save();
    res.status(201).json({ success: true, data: newBook }); // Wrap in success object
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Only image files are allowed!")
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    // Handle duplicate title error (now includes classId in unique index)
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Book with this title, author, and class already exists for this school",
        });
    }
    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    console.error("Create book error:", err); // Log unexpected errors
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.getBooks = async (req, res) => {
  // This seems to be a duplicate of getAllBooks, keeping for now but might need review
  try {
    const { schoolId } = req.query;
    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }
    // MODIFIED: Populate classId instead of category
    const books = await Book.find({ schoolId: schoolId }).populate(
      "classId",
      "className section"
    );
    res.json({ success: true, data: books }); // Wrap in success object
  } catch (err) {
    console.error("Get books error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  try {
    const { title, author, price, classId, description, stock, schoolId } =
      req.body; // MODIFIED: Changed 'category' to 'classId'

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const updateFields = { title, author, price, description, stock };

    // Validate classId if provided and different from existing
    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid class ID format" });
      }
      const classDoc = await Class.findById({
        _id: classId,
        schoolId: schoolId,
      }); // MODIFIED: Find class by ID and schoolId
      if (!classDoc) {
        return res
          .status(400)
          .json({ success: false, message: "Class not found for this school" });
      }
      updateFields.classId = classId; // MODIFIED: Assign classId
    }

    // Handle image update if provided
    if (req.file) {
      updateFields.image = await uploadFile2(req.file, `books/${schoolId}`)
    }

    const updatedBook = await Book.findByIdAndUpdate(
      { _id: req.params.id, schoolId: schoolId },
      updateFields,
      {
        new: true,
        runValidators: true, // Ensure validators run on update
      }
    ).populate("classId", "className section"); // MODIFIED: Populate classId instead of category

    if (!updatedBook) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Book not found or does not belong to this school",
        });
    }

    res.json({ success: true, data: updatedBook }); // Wrap in success object
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Only image files are allowed!")
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 11000) {
      // Handle duplicate key error on update
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Book with this title, author, and class already exists for this school",
        });
    }
    console.error("Update book error:", err); // Log unexpected errors
    res
      .status(400)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const book = await Book.findByIdAndDelete({ _id: id, schoolId: schoolId });
    if (!book) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Book not found or does not belong to this school",
        });
    }

    res.json({ success: true, message: "Book deleted successfully" }); // Wrap in success object
  } catch (err) {
    console.error("Delete book error:", err); // Log unexpected errors
    res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

exports.getAllBooksBySchool = async (req, res) => {
  try {
    const { schoolId, search, sort, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    console.log("Getting ALL books for school:", schoolId);

    const query = { schoolId: schoolId };

    // 🔍 Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    // 🔽 Sorting
    const sortOption = {};
    if (sort === "price-low") {
      sortOption.price = 1;
    } else if (sort === "price-high") {
      sortOption.price = -1;
    } else if (sort === "newest") {
      sortOption.createdAt = -1;
    } else {
      sortOption.title = 1; // Default sort by title
    }

    // 📑 Pagination
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const totalBooks = await Book.countDocuments(query);

    const books = await Book.find(query)
      .populate("classId", "className section")
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    console.log(`Found ${books.length} books for school ${schoolId}`);

    res.json({
      success: true,
      count: books.length,
      totalBooks,
      totalPages: Math.ceil(totalBooks / pageSize),
      currentPage: pageNumber,
      data: books,
    });
  } catch (err) {
    console.error("Get all books by school error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

exports.getAllBooksUnfiltered = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // pagination params

    // Count total books
    const total = await Book.countDocuments();

    // Fetch books with pagination, populate classId, and sort by newest first
    const books = await Book.find({})
      .populate("classId", "className section")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: books,
    });
  } catch (err) {
    console.error("Get all books unfiltered error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
