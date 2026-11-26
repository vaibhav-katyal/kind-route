import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "kindroute_secret_jwt_key_2026_super_secure",
    {
      expiresIn: "30d",
    }
  );
};

// @desc    Register a new user / NGO account
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "donor", location, orgName, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists. Please log in.",
      });
    }

    // Create user in MongoDB
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role === "ngo" ? "ngo" : "donor",
      location: location ? location.trim() : "Noida, Uttar Pradesh",
      orgName: orgName ? orgName.trim() : role === "ngo" ? name.trim() : "",
      phone: phone ? phone.trim() : "",
      points: role === "donor" ? 120 : 0,
      verified: true,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        orgName: user.orgName,
        phone: user.phone,
        points: user.points,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error creating user account.",
      error: error.message,
    });
  }
};

// @desc    Log in user / NGO
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password.",
      });
    }

    // Find user with password included
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        orgName: user.orgName,
        phone: user.phone,
        points: user.points,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        orgName: user.orgName,
        phone: user.phone,
        points: user.points,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching user profile.",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, location, orgName, phone, role } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (name) user.name = name.trim();
    if (location) user.location = location.trim();
    if (orgName !== undefined) user.orgName = orgName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (role && ["donor", "ngo"].includes(role)) {
      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        orgName: user.orgName,
        phone: user.phone,
        points: user.points,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error updating profile.",
      error: error.message,
    });
  }
};

// @desc    Switch user role between donor and ngo
// @route   POST /api/auth/switch-role
// @access  Private
export const switchRole = async (req, res) => {
  try {
    const { targetRole } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // If targetRole specified, use it; otherwise toggle between donor and ngo
    const newRole =
      targetRole && ["donor", "ngo"].includes(targetRole)
        ? targetRole
        : user.role === "donor"
        ? "ngo"
        : "donor";

    user.role = newRole;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Switched to ${newRole === "ngo" ? "NGO" : "Donor"} workspace successfully.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        orgName: user.orgName,
        phone: user.phone,
        points: user.points,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error switching role.",
      error: error.message,
    });
  }
};
