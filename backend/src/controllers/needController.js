import Need from "../models/Need.js";

// @desc    Get all NGO requirements/needs
// @route   GET /api/needs
// @access  Public
export const getNeeds = async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category && category !== "All items") {
      query.category = category;
    }

    const needs = await Need.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: needs.length,
      needs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching NGO requirements.",
      error: error.message,
    });
  }
};

// @desc    Create a new requirement / need
// @route   POST /api/needs
// @access  Public / Private
export const createNeed = async (req, res) => {
  try {
    const {
      name,
      category,
      title,
      detail,
      amount,
      color = "orange",
      location,
      coordinates,
    } = req.body;

    const ngoName = req.user?.name || name;

    if (!ngoName || !title || !detail || !amount) {
      return res.status(400).json({
        success: false,
        message: "Organization name, title, detail, and quantity needed are required.",
      });
    }

    const need = await Need.create({
      name: ngoName.trim(),
      category: category || "Food",
      title: title.trim(),
      detail: detail.trim(),
      amount: amount.trim(),
      color,
      location: location || req.user?.location || "Noida, Uttar Pradesh",
      coordinates:
        coordinates && coordinates.length === 2
          ? coordinates
          : [28.627, 77.371],
      ngoUser: req.user ? req.user._id : null,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Need requirement posted successfully to the community network.",
      need,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error creating requirement.",
      error: error.message,
    });
  }
};

// @desc    Delete a requirement
// @route   DELETE /api/needs/:id
// @access  Public / Private
export const deleteNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const need = await Need.findByIdAndDelete(id);

    if (!need) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Requirement removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error deleting requirement.",
      error: error.message,
    });
  }
};
