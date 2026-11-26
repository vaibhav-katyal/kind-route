import mongoose from "mongoose";

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
      enum: ["Available", "Pickup scheduled", "Delivered", "Cancelled"],
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
    // Reference to NGO that claimed/reserved the pickup
    ngoUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ngo: {
      type: String,
      default: "",
    },
    reservedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
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
