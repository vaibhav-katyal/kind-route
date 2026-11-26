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

// Helper to format donation output
const formatDoc = (doc) => ({
  _id: doc._id,
  id: doc.donationCode || `KR-${doc._id.toString().slice(-4)}`,
  donationCode: doc.donationCode,
  title: doc.title,
  category: doc.category,
  quantity: doc.quantity,
  location: doc.location,
  distance: doc.distance || "Nearby",
  ngo: doc.ngo || "",
  ngoLocation: doc.ngoLocation || "",
  ngoCoordinates:
    doc.ngoCoordinates && doc.ngoCoordinates.length === 2
      ? doc.ngoCoordinates
      : [28.632, 77.375],
  status: doc.status,
  date: doc.date,
  image: doc.image,
  description: doc.description,
  coordinates:
    doc.coordinates && doc.coordinates.length === 2
      ? doc.coordinates
      : [28.627, 77.371],
  owner: doc.owner,
  donor: doc.donor,
  requests: doc.requests || [],
  reservedAt: doc.reservedAt,
  startedDeliveryAt: doc.startedDeliveryAt,
  deliveredAt: doc.deliveredAt,
  thanksNote: doc.thanksNote || "",
  createdAt: doc.createdAt,
});

// @desc    Get all donations
// @route   GET /api/donations
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

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations: donations.map(formatDoc),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching donations.",
      error: error.message,
    });
  }
};

// @desc    Get single donation by ID
// @route   GET /api/donations/:id
export const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      donation: formatDoc(donation),
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
      // If fulfilling an existing NGO request/need directly
      targetNgo,
      targetNgoLocation,
      targetNgoCoordinates,
    } = req.body;

    if (!title || !quantity || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, quantity, and location are required to list a donation.",
      });
    }

    const donorUser = req.user || null;
    const ownerName = donorUser ? donorUser.name : (req.body.owner || "Kindness Donor");

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

    const donationData = {
      donationCode,
      title: title.trim(),
      category,
      quantity: quantity.trim(),
      location: location.trim(),
      distance: "Nearby",
      description: description.trim(),
      date: formattedDate,
      status: targetNgo ? "Approved" : "Available",
      image: selectedImage,
      coordinates:
        coordinates && coordinates.length === 2
          ? coordinates
          : [28.627, 77.371],
      donor: donorUser ? donorUser._id : null,
      owner: ownerName,
      requests: [],
    };

    if (targetNgo) {
      donationData.ngo = targetNgo;
      donationData.ngoLocation = targetNgoLocation || "Noida, Uttar Pradesh";
      donationData.ngoCoordinates = targetNgoCoordinates || [28.632, 77.375];
      donationData.reservedAt = new Date();
    }

    const donation = await Donation.create(donationData);

    return res.status(201).json({
      success: true,
      message: targetNgo
        ? `Donation scheduled with ${targetNgo}!`
        : "Donation posted! Visible to all verified NGOs for requests.",
      donation: formatDoc(donation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error posting donation.",
      error: error.message,
    });
  }
};

// @desc    NGO requests a donation
// @route   POST /api/donations/:id/request
export const requestDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { ngoName, ngoLocation, ngoCoordinates, phone, message } = req.body;

    const actualNgoName = req.user?.name || ngoName;
    if (!actualNgoName) {
      return res.status(400).json({
        success: false,
        message: "NGO name is required to request a donation.",
      });
    }

    const donation = await Donation.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    if (donation.status !== "Available" && donation.status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: `This donation is already ${donation.status.toLowerCase()}.`,
      });
    }

    // Check if this NGO has already requested
    const alreadyRequested = donation.requests?.some(
      (r) => r.ngoName.toLowerCase() === actualNgoName.toLowerCase()
    );

    if (alreadyRequested) {
      return res.status(400).json({
        success: false,
        message: "Your organization has already submitted a request for this donation.",
      });
    }

    const newRequest = {
      ngoUser: req.user?._id || null,
      ngoName: actualNgoName,
      ngoLocation: ngoLocation || req.user?.location || "Noida, Uttar Pradesh",
      ngoCoordinates:
        ngoCoordinates && ngoCoordinates.length === 2
          ? ngoCoordinates
          : [28.635, 77.38],
      phone: phone || req.user?.phone || "",
      message: message || "We can collect this donation for our community beneficiaries.",
      requestedAt: new Date(),
      status: "pending",
    };

    donation.requests.push(newRequest);
    donation.status = "Requested";
    await donation.save();

    return res.status(200).json({
      success: true,
      message: `Request submitted to ${donation.owner}! Waiting for donor approval.`,
      donation: formatDoc(donation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error requesting donation.",
      error: error.message,
    });
  }
};

// @desc    Donor approves an NGO's request
// @route   POST /api/donations/:id/approve
export const approveDonationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestId, ngoName } = req.body;

    const donation = await Donation.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    // Find the request to approve
    let selectedRequest = null;
    if (requestId) {
      selectedRequest = donation.requests.id(requestId);
    } else if (ngoName) {
      selectedRequest = donation.requests.find(
        (r) => r.ngoName.toLowerCase() === ngoName.toLowerCase()
      );
    }

    if (!selectedRequest && donation.requests.length > 0) {
      selectedRequest = donation.requests[0];
    }

    if (!selectedRequest) {
      return res.status(400).json({
        success: false,
        message: "No valid NGO request found to approve.",
      });
    }

    // Mark approved request and reject others
    donation.requests.forEach((reqItem) => {
      if (reqItem._id.toString() === selectedRequest._id.toString()) {
        reqItem.status = "approved";
      } else {
        reqItem.status = "rejected";
      }
    });

    donation.ngo = selectedRequest.ngoName;
    donation.ngoUser = selectedRequest.ngoUser || null;
    donation.ngoLocation = selectedRequest.ngoLocation || "Noida, Uttar Pradesh";
    donation.ngoCoordinates = selectedRequest.ngoCoordinates || [28.635, 77.38];
    donation.status = "Approved";
    donation.reservedAt = new Date();

    await donation.save();

    return res.status(200).json({
      success: true,
      message: `Request from ${selectedRequest.ngoName} approved! You can now start delivery.`,
      donation: formatDoc(donation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error approving request.",
      error: error.message,
    });
  }
};

// @desc    Donor or NGO starts delivery (triggers real map route)
// @route   POST /api/donations/:id/start-delivery
export const startDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    if (donation.status !== "Approved" && donation.status !== "Pickup scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only approved donations can be started for delivery.",
      });
    }

    donation.status = "In transit";
    donation.startedDeliveryAt = new Date();
    await donation.save();

    return res.status(200).json({
      success: true,
      message: "Delivery started! The real route between donor and NGO is now active.",
      donation: formatDoc(donation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error starting delivery.",
      error: error.message,
    });
  }
};

// @desc    NGO acknowledges receipt and writes a thanks note
// @route   POST /api/donations/:id/acknowledge
export const acknowledgeReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { thanksNote } = req.body;

    const donation = await Donation.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    donation.status = "Delivered";
    donation.thanksNote =
      thanksNote?.trim() ||
      "Thank you so much for your generosity! Your donation has reached our community members and made a genuine difference.";
    donation.deliveredAt = new Date();
    await donation.save();

    // Reward +120 kindness points to the donor
    if (donation.donor) {
      await User.findByIdAndUpdate(donation.donor, {
        $inc: { points: 120 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receipt acknowledged! Thanks note delivered and 120 points awarded to the donor.",
      donation: formatDoc(donation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error acknowledging receipt.",
      error: error.message,
    });
  }
};

// Backward-compatible endpoints
export const reserveDonation = requestDonation;
export const completeDonation = acknowledgeReceipt;

// @desc    Release / Cancel reservation
// @route   POST /api/donations/:id/release
export const releaseDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
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
    donation.ngoLocation = "";
    donation.reservedAt = null;
    donation.startedDeliveryAt = null;

    await donation.save();

    return res.status(200).json({
      success: true,
      message: "Donation is now available for new requests.",
      donation: formatDoc(donation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error releasing donation.",
      error: error.message,
    });
  }
};

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
export const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findOneAndDelete({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { donationCode: id },
      ],
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
