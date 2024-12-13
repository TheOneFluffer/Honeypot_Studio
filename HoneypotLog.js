const mongoose = require('mongoose');

// Create a dynamic log schema based on honeypot name
const createLogSchema = (honeypotName) => {
    return new mongoose.Schema(
        {
            timestamp: { type: Date, default: Date.now },
            event: { type: String, required: true },
            sourceIP: { type: String, required: true },
            details: { type: Object, default: {} },
        },
        { collection: `logs_${honeypotName}` } // Collection name based on honeypot name
    );
};

// Create and return a log model for the given honeypot name
const createLogModel = (honeypotName) => {
    return mongoose.model(`Log_${honeypotName}`, createLogSchema(honeypotName));
};

module.exports = { createLogModel }; // Ensure this export is correct
