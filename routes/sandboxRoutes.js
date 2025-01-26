const express = require('express');
const { processLogsForExeFiles, triageprocessLogsForExeFiles} = require('../controllers/sandboxController');
const router = express.Router();

// Route for transferring malware file to VirusTotal with analysis retrieval
router.post('/sandbox/:honeypotName/processExeFiles', processLogsForExeFiles);

// router.post('/sandbox/:honeypotName/traigeprocessExeFiles', triageprocessLogsForExeFiles);

module.exports = router;
