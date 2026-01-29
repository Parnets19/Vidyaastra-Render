// controllers/notificationController.js
const Notification = require("../models/Notification") // Adjust path as needed
// const Student = require('../models/Student'); // If you need to validate student existence



// @desc    Get all notifications for a specific student
// @route   GET /api/notifications/student/:studentId
// @access  Private (Student)
exports.getStudentNotifications = async (req, res) => {
  try {
    const { studentId } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!studentId || !schoolId) {
      return res.status(400).json({ success: false, message: "Student ID and School ID are required." })
    }

    const notifications = await Notification.find({ student: studentId, schoolId: schoolId }).sort({ createdAt: -1 }) // MODIFIED: Filter by studentId AND schoolId

    res.status(200).json({ success: true, data: notifications })
  } catch (error) {
    console.error("Error in getStudentNotifications:", error)
    res.status(500).json({ success: false, message: "Failed to fetch notifications." })
  }
}

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (Student)
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const notification = await Notification.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      { read: true },
      { new: true }, // Return the updated document
    )

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found or does not belong to this school." })
    }

    res.status(200).json({ success: true, message: "Notification marked as read.", data: notification })
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    res.status(500).json({ success: false, message: "Failed to mark notification as read." })
  }
}

// @desc    Mark all notifications for a specific student as read
// @route   PUT /api/notifications/student/:studentId/mark-all-read
// @access  Private (Student)
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const { studentId } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!studentId || !schoolId) {
      return res.status(400).json({ success: false, message: "Student ID and School ID are required." })
    }

    const result = await Notification.updateMany(
      { student: studentId, read: false, schoolId: schoolId }, // MODIFIED: Filter by studentId, read status AND schoolId
      { read: true },
    )

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read.`,
    })
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    res.status(500).json({ success: false, message: "Failed to mark all notifications as read." })
  }
}

// @desc    Create a new notification (typically for admin/system use)
// @route   POST /api/notifications
// @access  Private (Admin/System)
exports.createNotification = async (req, res) => {
  try {
    const { studentId, title, message, type, schoolId } = req.body // MODIFIED: Get schoolId from body

    // Basic validation
    if (!studentId || !title || !message || !schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID, title, message, and School ID are required." })
    }

    const newNotification = new Notification({
      student: studentId,
      title,
      message,
      type,
      schoolId, // MODIFIED: Add schoolId
    })

    await newNotification.save()
    res.status(201).json({ success: true, message: "Notification created successfully.", data: newNotification })
  } catch (error) {
    console.error("Error in createNotification:", error)
    res.status(500).json({ success: false, message: "Failed to create notification." })
  }
}

// @desc    Delete a notification (optional, for cleanup or admin)
// @route   DELETE /api/notifications/:id
// @access  Private (Admin/System)
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const notification = await Notification.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found or does not belong to this school." })
    }

    res.status(200).json({ success: true, message: "Notification deleted successfully." })
  } catch (error) {
    console.error("Error in deleteNotification:", error)
    res.status(500).json({ success: false, message: "Failed to delete notification." })
  }
}



exports.getAllNotificationsUnfiltered = async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: notifications })
  } catch (error) {
    console.error("Error in getAllNotificationsUnfiltered:", error)
    res.status(500).json({ success: false, message: "Failed to fetch all notifications." })
  }
}