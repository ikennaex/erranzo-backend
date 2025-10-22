const ErrandModel = require("../models/Errand");

const handleSearch = async (req, res) => {
  try {
    const { q } = req.query; // search query from frontend (e.g., /search?q=john)
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Sanitize input to avoid regex injection attacks
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const errands = await ErrandModel.find({
      $or: [
        { title: { $regex: safeQuery, $options: "i" } },
        { description: { $regex: safeQuery, $options: "i" } },
        { location: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(errands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { handleSearch };
