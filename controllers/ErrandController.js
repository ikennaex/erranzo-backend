const ErrandModel = require("../models/Errand");

const postErrand = async (req, res) => {
    const {title, description, budget, deadline, category, location, status, priority} = req.body;

    try {
        const newErrand = await ErrandModel.create({
            title,
            description,
            budget,
            deadline,
            category,
            location,
            status,
            priority,
            poster_id: req.user.id
        });
        res.status(200).json({message: "Errand posted successfully", newErrand});
    } catch (error) {
        res.status(500).json({ message: "Failed to post errand", error: error.message });
    }
}

const getAllErrands = async (req, res) => {
    try {
        const errands = await ErrandModel.find();
        res.status(200).json({message: "All errands fetched successfully", errands});
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch errands", error: error.message });
    }
}

const getErrandById = async (req, res) => {
    const { id } = req.params;

    try {
        const errand = await ErrandModel.findById(id);
        if (!errand) {
            return res.status(404).json({ message: "Errand not found" });
        }
        res.status(200).json({ message: "Errand fetched successfully", errand });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch errand", error: error.message });
    }
}

const deleteErrand = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedErrand = await ErrandModel.findByIdAndDelete(id);
        if (!deletedErrand) {
            return res.status(404).json({ message: "Errand not found" });
        }
        res.status(200).json({ message: "Errand deleted successfully", deletedErrand });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete errand", error: error.message });
    }
}

const editErrand = async (req, res) => {
    const { id } = req.params;
    const { title, description, budget, deadline, category, location, status, priority } = req.body;

    try {
        const updatedErrand = await ErrandModel.findByIdAndUpdate(id, {
            title,
            description,
            budget,
            deadline,
            category,
            location,
            status,
            priority
        }, { new: true, runValidators: true });

        if (!updatedErrand) {
            return res.status(404).json({ message: "Errand not found" });
        }
        res.status(200).json({ message: "Errand updated successfully", errand: updatedErrand });
    } catch (error) {
        res.status(500).json({ message: "Failed to update errand", error: error.message });
    }
}

module.exports = {
    postErrand,
    getAllErrands,
    getErrandById,
    deleteErrand,
    editErrand
}
