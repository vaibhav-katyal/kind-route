import Donation from "../models/Donation.js";
import User from "../models/User.js";

const imageCategoryFallbacks = {
  Food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85",
  Clothing: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=85",
  Books: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=700&q=85",
  Electronics: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
  Furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=85",
  Essentials: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=700&q=85",
};

// @desc    Get all donations (with optional filters)
// @route   GET /api/donations
// @access  Public
export const getAllDonations = async (req, res) => {
  try {
    const { category, status, search, owner, ngo } = req.query;

    const query = {};

    if (category && category !== "All items") {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (owner) {
      query.owner = owner;
    }

    if (ngo) {
      query.ngo = ngo;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const donations = await Donation.find(query).sort({ createdAt: -1 });

    // Format output matching kindroute's UI fields (id = donationCode or _id)
    const formatted = donations.map((doc) => ({
      _id: doc._id,
      id: doc.donationCode || `KR-${doc._id.toString().slice(-4)}`,
      title: doc.title,
      category: doc.category,
      quantity: doc.quantity,
      location: doc.location,
      distance: doc.distance || "Nearby",
      ngo: doc.ngo || "",
      status: doc.status,
      date: doc.date,
      image: doc.image,
      description: doc.description,
      coordinates: doc.coordinates && doc.coordinates.length === 2 ? doc.coordinates : [28.627, 77.371],
      owner: doc.owner,
      donor: doc.donor,
      reservedAt: doc.reservedAt,
      deliveredAt: doc.deliveredAt,
      createdAt: doc.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      donations: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching donations.",
      error: error.message,
    });
  }
};

// @desc    Get single donation by ID or donationCode
// @route   GET /api/donations/:id
// @access  Public
export const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;

    let donation;
    if (id.startsWith("KR-")) {
      donation = await Donation.findOne({ donationCode: id });
    } else {
      donation = await Donation.findById(id);
    }

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      donation: {
        _id: donation._id,
        id: donation.donationCode,
        title: donation.title,
        category: donation.category,
        quantity: donation.quantity,
        location: donation.location,
        distance: donation.distance,
        ngo: donation.ngo,
        status: donation.status,
        date: donation.date,
        image: donation.image,
        description: donation.description,
        coordinates: donation.coordinates,
        owner: donation.owner,
        donor: donation.donor,
        reservedAt: donation.reservedAt,
        deliveredAt: donation.deliveredAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching donation details.",
      error: error.message,
    });
  }
};

// @desc    Create / Post a new donation
// @route   POST /api/donations
// @access  Public / Private (supports both authenticated donor and guest/demo)
export const createDonation = async (req, res) => {
  try {
    const {
      title,
      category = "Food",
      quantity,
      location,
      description = "",
      image,
      coordinates,
      date,
    } = req.body;

    if (!title || !quantity || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, quantity, and location are required to list a donation.",
      });
    }

    const donorUser = req.user || null;
    const ownerName = donorUser ? donorUser.name : (req.body.owner || "Anonymous Donor");

    // Pick image fallback according to category if not provided
    const selectedImage =
      image ||
      imageCategoryFallbacks[category] ||
      imageCategoryFallbacks["Food"];

    const formattedDate =
      date ||
      new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

    const donationCode = `KR-${Math.floor(1000 + Math.random() * 9000)}`;

    const donation = await Donation.create({
      donationCode,
      title: title.trim(),
      category,
      quantity: quantity.trim(),
      location: location.trim(),
      distance: "Nearby",
      description: description.trim(),
      date: formattedDate,
      status: "Available",
      ngo: "",
      image: selectedImage,
      coordinates: coordinates && coordinates.length === 2 ? coordinates : [28.627, 77.371],
      donor: donorUser ? donorUser._id : null,
      owner: ownerName,
    });

    return res.status(201).json({
      success: true,
      message: "Donation created successfully! A little kindness is on its way.",
      donation: {
        _id: donation._id,
        id: donation.donationCode,
        title: donation.title,
        category: donation.category,
        quantity: donation.quantity,
        location: donation.location,
        distance: donation.distance,
        ngo: donation.ngo,
        status: donation.status,
        date: donation.date,
        image: donation.image,
        description: donation.description,
        coordinates: donation.coordinates,
        owner: donation.owner,
        donor: donation.donor,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error posting donation.",
      error: error.message,
    });
  }
};

// @desc    Reserve / Receive donation by an NGO
// @route   POST /api/donations/:id/reserve
// @access  Public / Private (works with NGO user or specified ngoName)
export const reserveDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const ngoName = req.user ? req.user.name : (req.body.ngoName || "Robin Hood Army");

    let donation = await Donation.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationCode: id }],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    if (donation.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: `This donation is already ${donation.status.toLowerCase()}.`,
      });
    }

    donation.status = "Pickup scheduled";
    donation.ngo = ngoName;
    donation.ngoUser = req.user ? req.user._id : null;
    donation.reservedAt = new Date();

    await donation.save();

    return res.status(200).json({
      success: true,
      message: `Donation reserved by ${ngoName}. Your pickup is ready to coordinate.`,
      donation: {
        _id: donation._id,
        id: donation.donationCode,
        title: donation.title,
        category: donation.category,
        quantity: donation.quantity,
        location: donation.location,
        distance: donation.distance,
        ngo: donation.ngo,
        status: donation.status,
        date: donation.date,
        image: donation.image,
        description: donation.description,
        coordinates: donation.coordinates,
        owner: donation.owner,
        reservedAt: donation.reservedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error reserving donation.",
      error: error.message,
    });
  }
};

// @desc    Release / Cancel reservation (make available again)
// @route   POST /api/donations/:id/release
// @access  Public / Private
export const releaseDonation = async (req, res) => {
  try {
    const { id } = req.params;

    let donation = await Donation.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationCode: id }],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    donation.status = "Available";
    donation.ngo = "";
    donation.ngoUser = null;
    donation.reservedAt = null;

    await donation.save();

    return res.status(200).json({
      success: true,
      message: "Reservation released. Donation is now available again for other NGOs.",
      donation: {
        _id: donation._id,
        id: donation.donationCode,
        status: donation.status,
        ngo: donation.ngo,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error releasing reservation.",
      error: error.message,
    });
  }
};

// @desc    Complete / Confirm delivery of donation
// @route   POST /api/donations/:id/complete
// @access  Public / Private
export const completeDonation = async (req, res) => {
  try {
    const { id } = req.params;

    let donation = await Donation.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationCode: id }],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    donation.status = "Delivered";
    donation.deliveredAt = new Date();
    await donation.save();

    // Reward points to donor if linked to an account
    if (donation.donor) {
      await User.findByIdAndUpdate(donation.donor, {
        $inc: { points: 120 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery confirmed and recorded! 120 kindness points awarded.",
      donation: {
        _id: donation._id,
        id: donation.donationCode,
        title: donation.title,
        status: donation.status,
        deliveredAt: donation.deliveredAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error completing delivery.",
      error: error.message,
    });
  }
};

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
// @access  Public / Private
export const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationCode: id }],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error deleting donation.",
      error: error.message,
    });
  }
};
