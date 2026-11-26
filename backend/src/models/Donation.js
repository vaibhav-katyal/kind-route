import mongoose from "mongoose";

const requestSubSchema = new mongoose.Schema(
  {
    ngoUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ngoName: {
      type: String,
      required: true,
    },
    ngoLocation: {
      type: String,
      default: "",
    },
    ngoCoordinates: {
      type: [Number],
      default: [28.627, 77.371],
    },
    phone: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { _id: true }
);

const donationSchema = new mongoose.Schema(
  {
    donationCode: {
      type: String,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Food",
        "Clothing",
        "Books",
        "Electronics",
        "Furniture",
        "Essentials",
        "Other",
      ],
      default: "Food",
    },
    quantity: {
      type: String,
      required: [true, "Quantity is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    distance: {
      type: String,
      default: "Nearby",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
    },
    status: {
      type: String,
      enum: [
        "Available",
        "Requested",
        "Approved",
        "Pickup scheduled",
        "In transit",
        "Delivered",
        "Cancelled",
      ],
      default: "Available",
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=700&q=85",
    },
    coordinates: {
      type: [Number],
      default: [28.627, 77.371],
    },
    // Reference to donor user
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    owner: {
      type: String,
      required: [true, "Owner name is required"],
    },
    // List of requests made by NGOs
    requests: [requestSubSchema],

    // Selected NGO details
    ngoUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ngo: {
      type: String,
      default: "",
    },
    ngoLocation: {
      type: String,
      default: "",
    },
    ngoCoordinates: {
      type: [Number],
      default: [28.627, 77.371],
    },
    reservedAt: {
      type: Date,
    },
    startedDeliveryAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    // NGO's personalized gratitude note upon receipt
    thanksNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-assign custom id like KR-xxxx if not provided
donationSchema.pre("save", function (next) {
  if (!this.donationCode) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.donationCode = `KR-${randomSuffix}`;
  }
  next();
});

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
