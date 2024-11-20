const mongoose = require('mongoose');

const honeypotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'low' or 'high' interaction
    config: { type: Object, required: true },
    status: { type: String, default: 'inactive' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Honeypot', honeypotSchema);
