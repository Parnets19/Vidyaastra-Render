const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true
    },  
});

module.exports = mongoose.model("Session", sessionSchema);