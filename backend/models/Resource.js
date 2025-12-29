const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    type: { type: String, enum: ["food", "clothes", "shelter", "medicine"], required: true },
    quantity: { type: Number, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    campName: { type: String, required: true },
    canDeliverToCamp: { type: Boolean, default: false },
    status: { type: String, enum: ["requested", "donated"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Resource", ResourceSchema);