import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Import route handlers
import authRoutes from "./routes/authRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import needRoutes from "./routes/needRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

// Load environment variables from .env
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Setup CORS
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
  })
);

// Logging in development
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "KindRoute Backend API is running smoothly",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/needs", needRoutes);
app.use("/api/stats", statsRoutes);

// Root route
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>KindRoute Backend</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 10px; background: #2f6142; color: white; border-radius: 999px; font-size: 13px; font-weight: 600; }
          code { background: #f0f3ec; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <span class="badge">KindRoute API</span>
        <h2>KindRoute Express.js & MongoDB Backend</h2>
        <p>Backend server is active. Connected to MongoDB.</p>
        <ul>
          <li><strong>Auth:</strong> <code>/api/auth/register</code>, <code>/api/auth/login</code>, <code>/api/auth/switch-role</code></li>
          <li><strong>Donations:</strong> <code>/api/donations</code> (GET, POST), <code>/api/donations/:id/reserve</code>, <code>/api/donations/:id/complete</code></li>
          <li><strong>NGO Needs:</strong> <code>/api/needs</code></li>
          <li><strong>Platform Stats:</strong> <code>/api/stats</code></li>
          <li><strong>Health Check:</strong> <code>/api/health</code></li>
        </ul>
      </body>
    </html>
  `);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 KindRoute Backend server is running on http://localhost:${PORT}`);
  console.log(`📡 Ready to receive requests from frontend at http://localhost:5173\n`);
});

export default app;
