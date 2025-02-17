const express = require('express');
const { processLogsForExeFiles} = require('../controllers/sandboxController');
const router = express.Router();

// Route for transferring malware file to VirusTotal with analysis retrieval
router.post('/sandbox/:honeypotName/processExeFiles', processLogsForExeFiles);

module.exports = router;
