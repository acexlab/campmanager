const express = require("express");
const Alert = require("../models/Alert");

const router = express.Router();

// Get all alerts
router.get("/", async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get alerts in an area
router.get("/area", async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 50000 } = req.query; // maxDistance in meters, default 50km

        if (!longitude || !latitude) {
            return res.status(400).json({ error: "Longitude and latitude are required" });
        }

        const alerts = await Alert.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            },
            status: 'active'
        }).sort({ createdAt: -1 });

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single alert
router.get("/:id", async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        res.json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new alert
router.post("/", async (req, res) => {
    try {
        const {
            title,
            type,
            description,
            location,
            coordinates,
            affectedRadius
        } = req.body;

        // Basic validation
        if (!title || !type || !description || !location || !coordinates || !affectedRadius) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate coordinates
        if (!Array.isArray(coordinates) || coordinates.length !== 2 ||
            coordinates[0] < -180 || coordinates[0] > 180 ||
            coordinates[1] < -90 || coordinates[1] > 90) {
            return res.status(400).json({ error: "Invalid coordinates" });
        }

        // Validate affected radius
        if (affectedRadius <= 0 || affectedRadius > 1000) {
            return res.status(400).json({ error: "Affected radius must be between 0 and 1000 km" });
        }

        const newAlert = new Alert({
            title,
            type,
            description,
            location,
            coordinates: {
                type: "Point",
                coordinates
            },
            affectedRadius
        });

        await newAlert.save();
        res.status(201).json(newAlert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an alert
router.put("/:id", async (req, res) => {
    try {
        const {
            title,
            type,
            description,
            location,
            coordinates,
            affectedRadius,
            status
        } = req.body;

        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        // Update fields if provided
        if (title) alert.title = title;
        if (type) alert.type = type;
        if (description) alert.description = description;
        if (location) alert.location = location;
        if (coordinates) {
            alert.coordinates = {
                type: "Point",
                coordinates
            };
        }
        if (affectedRadius) {
            if (affectedRadius <= 0 || affectedRadius > 1000) {
                return res.status(400).json({ error: "Affected radius must be between 0 and 1000 km" });
            }
            alert.affectedRadius = affectedRadius;
        }
        if (status && ['active', 'resolved'].includes(status)) {
            alert.status = status;
        }

        alert.lastUpdated = new Date();
        await alert.save();
        res.json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an alert
router.delete("/:id", async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        await Alert.findByIdAndDelete(req.params.id);
        res.json({ message: "Alert deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;