const mongoose= require("mongoose");

const studentSchema = new mongoose.Schema({ 
    className: {
    type: String,
    required: true,
    trim: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true
    }
},{timestamps:true});
module.exports =  mongoose.model("classname", studentSchema);