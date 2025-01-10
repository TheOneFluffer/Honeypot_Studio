const express = require('express');
const { createHoneypot, getHoneypots, updateHoneypot, deleteHoneypot, deployHoneypotController, removeHoneypotController, getHoneypotStatus, logHoneypotEvent, startAllHoneypots,fetchLogs,fetchHoneypotLogs, checkForUploads, fetchAllLogs, getLogs, searchHoneypots  } = require('../controllers/honeypotController');
const router = express.Router();

// Routes
router.post('/honeypots', createHoneypot);
router.get('/honeypots', getHoneypots);
router.put('/honeypots/:id', updateHoneypot);
router.delete('/honeypots/:id', deleteHoneypot);
router.post('/honeypots/deploy', deployHoneypotController);
router.delete('/honeypots/remove/:name/:containerID', removeHoneypotController);
router.get('/honeypots/status', getHoneypotStatus);
router.post('/honeypots/log', logHoneypotEvent);
router.post('/honeypots/start', startAllHoneypots);
router.get('/logs/:containerId', fetchLogs);
router.post('/honeypots/logs/:honeypotName', fetchHoneypotLogs);
router.get('/honeypots/check-uploads/:containerID', checkForUploads);
router.get('/honeypots/alllogs/:containerId', fetchAllLogs); //Get all logs from docker individual honeypot 
router.get('/honeypots/logs',getLogs) //Get all filtered logs from Elkstack individually for every honeypot
router.get('/honeypots/search',searchHoneypots) //Partial search of honeypots 
module.exports = router;
