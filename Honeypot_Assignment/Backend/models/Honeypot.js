const mongoose = require('mongoose');

const honeypotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'low' or 'high' interaction
    image: { type: String, required: true },
    port: { type: Number, required: true },
    status: { type: String, default: 'inactive' }, // e.g., 'deployed', 'removed'
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Honeypot', honeypotSchema);
