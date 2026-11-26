import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Donation from "../models/Donation.js";
import Need from "../models/Need.js";

dotenv.config();

const initialDonationsData = [
  {
    donationCode: "KR-1042",
    title: "Fresh meals, ready to share",
    category: "Food",
    quantity: "25 meal boxes",
    location: "Sector 62, Noida",
    distance: "1.2 km",
    ngo: "Robin Hood Army",
    status: "Pickup scheduled",
    date: "Today, 4:30 PM",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85",
    description:
      "Freshly prepared vegetarian rice, dal and vegetables. Packed in individual boxes.",
    coordinates: [28.627, 77.371],
    owner: "Alex Morgan",
  },
  {
    donationCode: "KR-1041",
    title: "A little warmth for someone",
    category: "Clothing",
    quantity: "12 winter essentials",
    location: "Indirapuram, Ghaziabad",
    distance: "2.8 km",
    ngo: "Goonj Foundation",
    status: "Available",
    date: "Today, 6:00 PM",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=85",
    description:
      "Clean sweaters and jackets, in good condition. Mixed adult sizes.",
    coordinates: [28.642, 77.369],
    owner: "Alex Morgan",
  },
  {
    donationCode: "KR-1040",
    title: "Stories with a new chapter",
    category: "Books",
    quantity: "18 books & notebooks",
    location: "Sector 50, Noida",
    distance: "3.5 km",
    ngo: "Uday Foundation",
    status: "Delivered",
    date: "Yesterday",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=700&q=85",
    description:
      "Children’s storybooks and unused notebooks for school students.",
    coordinates: [28.57, 77.363],
    owner: "Alex Morgan",
  },
  {
    donationCode: "KR-1039",
    title: "A brighter place to learn",
    category: "Electronics",
    quantity: "2 working study lamps",
    location: "Sector 18, Noida",
    distance: "4.1 km",
    ngo: "",
    status: "Available",
    date: "Tomorrow, 10:00 AM",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
    description:
      "Two working desk lamps with LED bulbs, ideal for a learning centre.",
    coordinates: [28.571, 77.326],
    owner: "Priya Sharma",
  },
];

const initialNeedsData = [
  {
    name: "Robin Hood Army",
    category: "Food",
    title: "A warm meal. A better evening.",
    detail: "Help us serve 50 people in Sector 62.",
    amount: "50 meals needed",
    color: "orange",
  },
  {
    name: "Goonj Foundation",
    category: "Clothing",
    title: "Make someone’s winter warmer.",
    detail: "Winter clothes for families in Noida.",
    amount: "30 items needed",
    color: "purple",
  },
  {
    name: "Uday Foundation",
    category: "Books",
    title: "Books that open new doors.",
    detail: "For an evening learning circle in Indirapuram.",
    amount: "20 books needed",
    color: "blue",
  },
  {
    name: "Feeding India",
    category: "Food",
    title: "Nourish young minds.",
    detail: "Surplus packed snacks and fruits for kids.",
    amount: "40 fruit packets",
    color: "green",
  },
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kindroute";
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding.");

    // Clear existing data
    await User.deleteMany();
    await Donation.deleteMany();
    await Need.deleteMany();
    console.log("Cleared existing collections.");

    // Create Demo Users
    const donorUser = await User.create({
      name: "Alex Morgan",
      email: "alex@kindroute.org",
      password: "password123",
      role: "donor",
      location: "Noida, Uttar Pradesh",
      phone: "+91 98765 43210",
      points: 1240,
      verified: true,
    });

    const ngoUser1 = await User.create({
      name: "Robin Hood Army",
      email: "robinhood@kindroute.org",
      password: "password123",
      role: "ngo",
      orgName: "Robin Hood Army Noida Chapter",
      location: "Sector 62, Noida",
      phone: "+91 98123 45678",
      points: 0,
      verified: true,
    });

    const ngoUser2 = await User.create({
      name: "Goonj Foundation",
      email: "goonj@kindroute.org",
      password: "password123",
      role: "ngo",
      orgName: "Goonj Community Centre",
      location: "Indirapuram, Ghaziabad",
      phone: "+91 98987 65432",
      points: 0,
      verified: true,
    });

    console.log("Created demo users:");
    console.log("  - Donor: alex@kindroute.org / password123");
    console.log("  - NGO 1: robinhood@kindroute.org / password123");
    console.log("  - NGO 2: goonj@kindroute.org / password123");

    // Create Initial Donations
    for (const d of initialDonationsData) {
      await Donation.create({
        ...d,
        donor: d.owner === "Alex Morgan" ? donorUser._id : null,
        ngoUser: d.ngo === "Robin Hood Army" ? ngoUser1._id : d.ngo === "Goonj Foundation" ? ngoUser2._id : null,
      });
    }
    console.log(`Created ${initialDonationsData.length} initial donations.`);

    // Create Initial Needs
    for (const n of initialNeedsData) {
      await Need.create({
        ...n,
        ngoUser: n.name === "Robin Hood Army" ? ngoUser1._id : n.name === "Goonj Foundation" ? ngoUser2._id : null,
      });
    }
    console.log(`Created ${initialNeedsData.length} NGO requirements.`);

    console.log("\n✅ Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedData();
