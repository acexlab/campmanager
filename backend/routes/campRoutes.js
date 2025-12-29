const express = require("express");
const Camp = require("../models/Camp");

const router = express.Router();

// Get all camps
router.get("/", async (req, res) => {
    try {
        const camps = await Camp.find().sort({ createdAt: -1 });
        res.json(camps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get nearby camps based on current location
{/*router.get("/nearby", async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters, default 10km

        if (!longitude || !latitude) {
            return res.status(400).json({ error: "Longitude and latitude are required" });
        }

        const camps = await Camp.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        });

        res.json(camps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single camp
router.get("/:id", async (req, res) => {
    try {
        const camp = await Camp.findById(req.params.id);
        if (!camp) {
            return res.status(404).json({ message: "Camp not found" });
        }
        res.json(camp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});*/}

// Create a new camp (Admin only)
router.post("/", async (req, res) => {
    try {
        const { name, location, capacity } = req.body;

        // Validate required fields
        if (!name || !location || location.lat === undefined || location.lng === undefined || !capacity) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate capacity
        if (capacity <= 0) {
            return res.status(400).json({ error: "Capacity must be greater than 0" });
        }

        // Validate lat/lng range
        if (location.lng < -180 || location.lng > 180 || location.lat < -90 || location.lat > 90) {
            return res.status(400).json({ error: "Invalid coordinates" });
        }

        // Create new camp
        const newCamp = new Camp({
            name,
            capacity,
            location: {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lng)
            }
        });

        await newCamp.save();
        res.status(201).json(newCamp);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});



// Update camp details (Admin only)
{/*router.put("/:id", async (req, res) => {
    try {
        const {
            name,
            location,
            capacity,
            coordinates,
            status
        } = req.body;

        // Find camp first
        const camp = await Camp.findById(req.params.id);
        if (!camp) {
            return res.status(404).json({ message: "Camp not found" });
        }

        // Update fields if provided
        if (name) camp.name = name;
        if (location) camp.location = location;
        if (capacity && capacity > 0) camp.capacity = capacity;
        if (coordinates) {
            camp.coordinates = {
                type: "Point",
                coordinates
            };
        }
        if (status && ['active', 'closed'].includes(status)) {
            camp.status = status;
        }

        camp.lastUpdated = new Date();
        await camp.save();
        res.json(camp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});*/}

// Delete a camp (Admin only)
router.delete("/:id", async (req, res) => {
    try {
        const camp = await Camp.findById(req.params.id);
        if (!camp) {
            return res.status(404).json({ message: "Camp not found" });
        }

        await Camp.findByIdAndDelete(req.params.id);
        res.json({ message: "Camp deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;