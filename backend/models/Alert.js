const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['flood', 'earthquake', 'hurricane', 'fire', 'landslide', 'other'],
        required: true 
    },
    description: { type: String, required: true },
    location: { type: String, required: true },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            validate: {
                validator: function(v) {
                    return v.length === 2 && 
                           v[0] >= -180 && v[0] <= 180 && // longitude
                           v[1] >= -90 && v[1] <= 90;     // latitude
                },
                message: 'Invalid coordinates'
            }
        }
    },
    affectedRadius: { 
        type: Number, 
        required: true,
        min: 0,
        max: 1000,  // maximum 1000 km radius
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Affected radius must be greater than 0'
        }
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

// Index for geospatial queries
AlertSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model("Alert", AlertSchema);
