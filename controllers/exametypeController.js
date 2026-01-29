const ExameType = require("../models/exameType");

exports.createExameType = async (req, res) => {
    try {
        const { schoolId, exameType } = req.body;
        if (!schoolId || !exameType) {
            return res.status(400).json({ success: false, message: "School ID and exame type are required." });
        }

    
        const existingExameType = await ExameType.findOne({ schoolId, exameType });
        if (existingExameType) {
            return res.status(400).json({ success: false, message: "Exame type already exists for this school." });
        }

        const newExameType = await ExameType.create({ schoolId, exameType });
        console.log("newExameType", newExameType);
        res.status(200).json({ success: true, data: newExameType });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

exports.getExameTypes = async (req, res) => {
    try {
        const { schoolId } = req.query;
        const exameTypes = await ExameType.find({ schoolId });
        res.status(200).json({ success: true, data: exameTypes });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

exports.deleteExameType = async (req, res) => {
    try {
        const { id } = req.params;
        const exameType = await ExameType.findOneAndDelete({ _id: id });
        res.status(200).json({ success: true, message: "Exame type deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

exports.updateExameType = async (req, res) => {
    try {
        const { id } = req.params;
        const { exameType } = req.body;
        const dataexameType = await ExameType.findOneAndUpdate({ _id: id }, { exameType });
        res.status(200).json({ success: true, message: "Exame type updated successfully", data: dataexameType });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}





