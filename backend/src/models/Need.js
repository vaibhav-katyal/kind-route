import mongoose from "mongoose";

const needSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "NGO Name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Food", "Clothing", "Books", "Electronics", "Furniture", "Essentials", "Other"],
      default: "Food",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    detail: {
      type: String,
      required: [true, "Detail is required"],
      trim: true,
    },
    amount: {
      type: String,
      required: [true, "Amount/quantity required is required"],
      trim: true,
    },
    color: {
      type: String,
      default: "orange",
    },
    location: {
      type: String,
      default: "Noida, Uttar Pradesh",
    },
    coordinates: {
      type: [Number],
      default: [28.627, 77.371],
    },
    ngoUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "fulfilled"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Need = mongoose.model("Need", needSchema);

export default Need;
