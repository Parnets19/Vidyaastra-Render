const mongoose = require('mongoose');

const exameTypeSchema = new mongoose.Schema({
    exameType: {
        type: String,
        required: true,
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
    },
});
module.exports = mongoose.model("exameType", exameTypeSchema);