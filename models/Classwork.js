const mongoose = require("mongoose")

const classworkSchema = new mongoose.Schema({
subject: {
  type: String,
  required: true,
},
date: {
  type: Date,
  required: true,
  default: Date.now,
},
topic: {
  type: String,
  required: true,
},
description: {
  type: String,
  required: true,
},
attachments: [
  {
    name: String,
    url: String,
  },
],
createdAt: {
  type: Date,
  default: Date.now,
},
// MODIFIED: Add schoolId field
schoolId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "School",
  required: true,
},
// NEW: Add classId field to link classwork to a specific class
classId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Class",
  required: true,
},
})

// Optional: Add a compound index for efficient querying and uniqueness if needed
// MODIFIED: Include classId in the compound index
classworkSchema.index({ subject: 1, date: 1, topic: 1, schoolId: 1, classId: 1 }, { unique: true })

module.exports = mongoose.model("Classwork", classworkSchema)
