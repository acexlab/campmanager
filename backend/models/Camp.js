const mongoose = require("mongoose");

const CampSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Camp name
    capacity: { type: Number, required: true }, // Maximum capacity
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

// Index for geospatial queries
CampSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model("Camp", CampSchema);
