const mongoose = require('mongoose');
const honeypotLogSchema = new mongoose.Schema({
    timestamp: {type: Date, default: Date.now},
    honeypotName: {type: String, required: true},
    log:{type: Object, required: true},
});

const HoneypotLog = mongoose.model('HoneypotLog', honeypotLogSchema);

module.exports=HoneypotLog;