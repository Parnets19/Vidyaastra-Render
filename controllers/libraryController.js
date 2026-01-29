const LibraryBook = require("../models/libraryBooks")
const IssuedBook = require("../models/IssuedBook")

// CRUD Operations for Library Books

// Create a new book
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies, availableCopies, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const copies = availableCopies !== undefined ? availableCopies : totalCopies

    const newBook = await LibraryBook.create({
      title,
      author,
      isbn,
      category,
      totalCopies,
      availableCopies: copies,
      schoolId, // MODIFIED: Add schoolId
    })

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "ISBN already exists", // ISBN is unique globally
      })
    }
    res.status(400).json({
      success: false,
      message: err.message,
    })
  }
}

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const { schoolId, category, search, page = 1, limit = 10 } = req.query // MODIFIED: Get schoolId, category, search, pagination from query
    const query = {}

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }
    query.schoolId = schoolId // MODIFIED: Filter by schoolId

    if (category) {
      query.category = category
    }
    if (search) {
      query.title = { $regex: search, $options: "i" } // Search by title
    }

    // Pagination setup
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Count total documents
    const total = await LibraryBook.countDocuments(query);

    // Fetch books with pagination
    const books = await LibraryBook.find(query)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limitNumber);

    res.json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: books,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get single book
const getBookById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const book = await LibraryBook.findOne({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found or does not belong to this school",
      })
    }
    res.json({
      success: true,
      data: book,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Update book
const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies, availableCopies, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updatedBook = await LibraryBook.findOneAndUpdate(
      { _id: req.params.id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      { title, author, isbn, category, totalCopies, availableCopies },
      { new: true, runValidators: true },
    )

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found or does not belong to this school",
      })
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "ISBN already exists",
      })
    }
    res.status(400).json({
      success: false,
      message: err.message,
    })
  }
}

// Delete book
const deleteBook = async (req, res) => {
  try {
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const issuedCount = await IssuedBook.countDocuments({
      book: req.params.id,
      status: "active",
      schoolId: schoolId, // MODIFIED: Filter by schoolId
    })

    if (issuedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete book with active issues for this school",
      })
    }

    const deletedBook = await LibraryBook.findOneAndDelete({ _id: req.params.id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId

    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found or does not belong to this school",
      })
    }

    res.json({
      success: true,
      message: "Book deleted successfully",
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get available books - FIXED RESPONSE FORMAT
const getAvailableBooks = async (req, res) => {
  try {
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const books = await LibraryBook.find({ availableCopies: { $gt: 0 }, schoolId: schoolId }) // MODIFIED: Filter by schoolId
    res.json({
      success: true,
      data: books,
    })
  } catch (err) {
    console.error("Get available books error:", err)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get issued books - FIXED RESPONSE FORMAT AND ROUTE HANDLING
const getIssuedBooks = async (req, res) => {
  try {
    // FIXED: Get both studentId and schoolId from query parameters
    const { studentId, schoolId } = req.query

    if (!studentId || !schoolId) {
      return res.status(400).json({ success: false, message: "Student ID and School ID are required." })
    }

    const issuedBooks = await IssuedBook.find({
      studentId: studentId,
      status: "active",
      schoolId: schoolId, // MODIFIED: Filter by schoolId
    }).populate("book")

    res.json({
      success: true,
      data: issuedBooks,
    })
  } catch (err) {
    console.error("Get issued books error:", err)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Issue book - FIXED RESPONSE FORMAT AND LOGIC
const issueBook = async (req, res) => {
  try {
    const { bookId, studentId, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!bookId || !studentId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Book ID, Student ID, and School ID are required",
      })
    }

    // Check if book exists and is available for this school
    const book = await LibraryBook.findOne({ _id: bookId, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found or does not belong to this school",
      })
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "Book not available for issue",
      })
    }

    // Check if student already has this book issued for this school
    const existingIssue = await IssuedBook.findOne({
      book: bookId,
      studentId: studentId,
      status: "active",
      schoolId: schoolId, // MODIFIED: Filter by schoolId
    })

    if (existingIssue) {
      return res.status(400).json({
        success: false,
        message: "You have already issued this book from this school",
      })
    }

    // Create issue record
    const issueDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(issueDate.getDate() + 30) // 30 days from issue

    const issuedBook = await IssuedBook.create({
      book: bookId,
      studentId: studentId,
      issueDate: issueDate,
      dueDate: dueDate,
      status: "active",
      schoolId: schoolId, // MODIFIED: Add schoolId
    })

    // Update book availability
    book.availableCopies -= 1
    await book.save()

    res.json({
      success: true,
      message: "Book issued successfully",
      data: {
        issuedBook: issuedBook,
        book: book,
      },
    })
  } catch (err) {
    console.error("Issue book error:", err)
    res.status(500).json({
      success: false,
      message: "Failed to issue book. Please try again.",
    })
  }
}

// Renew book - FIXED RESPONSE FORMAT AND LOGIC
const renewBook = async (req, res) => {
  try {
    const { issuedBookId, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!issuedBookId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Issued book ID and School ID are required",
      })
    }

    const issuedBook = await IssuedBook.findOne({ _id: issuedBookId, schoolId: schoolId }).populate("book") // MODIFIED: Find by ID AND schoolId
    if (!issuedBook) {
      return res.status(404).json({
        success: false,
        message: "Issued book record not found or does not belong to this school",
      })
    }

    if (issuedBook.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Book is not currently active for renewal",
      })
    }

    // Extend due date by 30 days
    const newDueDate = new Date(issuedBook.dueDate)
    newDueDate.setDate(newDueDate.getDate() + 30)

    issuedBook.dueDate = newDueDate
    await issuedBook.save()

    res.json({
      success: true,
      message: "Book renewed successfully",
      data: issuedBook,
    })
  } catch (err) {
    console.error("Renew book error:", err)
    res.status(500).json({
      success: false,
      message: "Failed to renew book. Please try again.",
    })
  }
}

// Return book - NEW FUNCTION
const returnBook = async (req, res) => {
  try {
    const { issuedBookId, schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!issuedBookId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Issued book ID and School ID are required",
      })
    }

    const issuedBook = await IssuedBook.findOne({ _id: issuedBookId, schoolId: schoolId }).populate("book") // MODIFIED: Find by ID AND schoolId
    if (!issuedBook) {
      return res.status(404).json({
        success: false,
        message: "Issued book record not found or does not belong to this school",
      })
    }

    // Update issued book status
    issuedBook.status = "returned"
    issuedBook.actualReturnDate = new Date()
    await issuedBook.save()

    // Update book availability
    const book = await LibraryBook.findOne({ _id: issuedBook.book._id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (book) {
      book.availableCopies += 1
      await book.save()
    }

    res.json({
      success: true,
      message: "Book returned successfully",
      data: issuedBook,
    })
  } catch (err) {
    console.error("Return book error:", err)
    res.status(500).json({
      success: false,
      message: "Failed to return book. Please try again.",
    })
  }
}


const getAllLibraryBooksUnfiltered = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // pagination params

    // Count total library books
    const total = await LibraryBook.countDocuments();

    // Fetch books with pagination
    const books = await LibraryBook.find({})
      .sort({ createdAt: -1 }) // optional: newest first
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
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};


module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getAvailableBooks,
  getIssuedBooks,
  issueBook,
  renewBook,
  returnBook,
   getAllLibraryBooksUnfiltered,
}
