const express = require("express");
const Resource = require("../models/Resource");
const Camp = require("../models/Camp");
const Alert = require("../models/Alert");

const router = express.Router();

// Get dashboard statistics
router.get("/stats", async (req, res) => {
    try {
        // Get total camps
        const totalCamps = await Camp.countDocuments({ status: 'active' });
        const totalCampsEver = await Camp.countDocuments();

        // Get resource statistics
        const resourceStats = await Resource.aggregate([
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    total: { $sum: "$quantity" }
                }
            }
        ]);

        // Process resource statistics
        const resourceSummary = {
            distributed: {
                food: 0,
                shelter: 0,
                clothes: 0,
                medicine: 0
            },
            donated: {
                food: 0,
                shelter: 0,
                clothes: 0,
                medicine: 0
            }
        };

        resourceStats.forEach(stat => {
            const type = stat._id.type;
            const status = stat._id.status;
            if (status === 'donated') {
                resourceSummary.donated[type] = stat.total;
            }
        });

        // Get total resources donated
        const totalDonated = Object.values(resourceSummary.donated).reduce((a, b) => a + b, 0);

        // Get active alerts count
        const activeAlerts = await Alert.countDocuments({ status: 'active' });

        res.json({
            camps: {
                active: totalCamps,
                total: totalCampsEver
            },
            resources: {
                byType: resourceSummary,
                totalDonated
            },
            activeAlerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get resource trends (last 7 days)
router.get("/trends", async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trends = await Resource.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        type: "$type",
                        status: "$status"
                    },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        res.json(trends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get recent activities
router.get("/recent-activities", async (req, res) => {
    try {
        const [recentResources, recentAlerts, recentCamps] = await Promise.all([
            Resource.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('type quantity status createdAt'),
            Alert.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title type location createdAt'),
            Camp.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name location createdAt')
        ]);

        res.json({
            resources: recentResources,
            alerts: recentAlerts,
            camps: recentCamps
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;