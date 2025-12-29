const express = require("express");
const Resource = require("../models/Resource");
const Camp = require("../models/Camp");

const router = express.Router();

// Get all resources
router.get("/", async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all camps for dropdown
router.get("/camps", async (req, res) => {
    try {
        const camps = await Camp.find().select('name');
        res.json(camps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request a Resource
router.post("/request", async (req, res) => {
    try {
        const { 
            name,
            contactNumber,
            type,
            quantity,
            priority,
            campName,
            canDeliverToCamp
        } = req.body;

        // Validate contact number
        if (!/^\d{10}$/.test(contactNumber)) {
            return res.status(400).json({ error: "Contact number must be 10 digits" });
        }

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({ error: "Quantity must be greater than 0" });
        }

        // Check if camp exists
        const campExists = await Camp.findOne({ name: campName });
        if (!campExists) {
            return res.status(400).json({ error: "Selected camp does not exist" });
        }

        const newResource = new Resource({
            name,
            contactNumber,
            type,
            quantity,
            priority,
            campName,
            canDeliverToCamp,
            status: "requested"
        });

        await newResource.save();
        res.status(201).json({ 
            message: "Resource requested successfully!",
            resource: newResource
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Donate a Resource
router.post("/donate", async (req, res) => {
    try {
        const { 
            name,
            contactNumber,
            type,
            quantity,
            campName,
            canDeliverToCamp
        } = req.body;

        // Validate contact number
        if (!/^\d{10}$/.test(contactNumber)) {
            return res.status(400).json({ error: "Contact number must be 10 digits" });
        }

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({ error: "Quantity must be greater than 0" });
        }

        // Check if camp exists
        const campExists = await Camp.findOne({ name: campName });
        if (!campExists) {
            return res.status(400).json({ error: "Selected camp does not exist" });
        }

        const newDonation = new Resource({
            name,
            contactNumber,
            type,
            quantity,
            priority: "low", // Donations don't need priority
            campName,
            canDeliverToCamp,
            status: "donated"
        });

        await newDonation.save();
        res.status(201).json({ 
            message: "Resource donated successfully!",
            resource: newDonation
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
