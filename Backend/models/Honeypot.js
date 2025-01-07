const mongoose = require('mongoose');
const honeypotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'low' or 'high' interaction
    image: { type: String, required: true },
    ports: { type: [Number], required: true },
    IP: { type: String, required: true},
    networkInterface:{type:String, required: true},
    honeynet: {type: String, required: true},
    deploymentLocation: {type: String, required: true},
    logRetention: {type: Number, required: true},
    alert:{type: String, required: true},
    status: { type: String, default: 'active' }, // e.g., 'deployed', 'removed'
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    
});

module.exports = mongoose.model('Honeypot', honeypotSchema);
