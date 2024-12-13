const express = require('express');
const { collectAndInsertLogs } = require('../controllers/logController'); // Import the controller
const router = express.Router();

// Define the route for collecting logs from a specific honeypot
router.get('/honeypots/:honeypotName/logs', collectAndInsertLogs);

module.exports = router;
