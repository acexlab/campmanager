require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Import Models
const User = require("./models/User");
const Resource = require("./models/Resource");
const Camp = require("./models/Camp");
const Alert = require("./models/Alert");

// Import Routes
const resourceRoutes = require("./routes/resourceRoutes");
const campRoutes = require("./routes/campRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");

// Use Routes
app.use("/api/resources", resourceRoutes);
app.use("/api/camps", campRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected successfully!"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Check if database is connected
mongoose.connection.once("open", () => {
    console.log("✅ Connected to MongoDB: campmanagertry1");
}).on("error", (error) => {
    console.error("❌ MongoDB Connection Error:", error);
});

// Root route
app.get("/", (req, res) => {
    res.send("Camp Manager Backend is Running!");
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
