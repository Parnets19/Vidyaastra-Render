const express = require("express")
const router = express.Router()
const libraryController = require("../controllers/libraryController")


router.get("/all-unfiltered", libraryController.getAllLibraryBooksUnfiltered)
// Available books
router.get("/available", libraryController.getAvailableBooks)

// UPDATED: Route to handle query parameters for issued books
router.get("/issued", libraryController.getIssuedBooks)

// Issue book
router.post("/issue", libraryController.issueBook)

// Renew book
router.post("/renew", libraryController.renewBook)

// Return book
router.post("/return", libraryController.returnBook)

// CRUD operations for library books
router.get("/", libraryController.getAllBooks)
router.post("/", libraryController.createBook)
router.get("/:id", libraryController.getBookById)
router.put("/:id", libraryController.updateBook)
router.delete("/:id", libraryController.deleteBook)

module.exports = router
