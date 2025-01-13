const express = require('express');
const {getHoneypots, updateHoneypot, deployHoneypotController, removeHoneypotController, getHoneypotStatus,fetchLogs,fetchHoneypotLogs, checkForUploads,fetchAllLogs,getLogs, searchHoneypots, getContainerIDRoute } = require('../controllers/honeypotController');
const router = express.Router();

// Routes

router.get('/honeypots', getHoneypots);
router.put('/honeypots/:id', updateHoneypot);
router.post('/honeypots/deploy', deployHoneypotController);
router.delete('/honeypots/remove/:name/:containerID', removeHoneypotController);
router.get('/honeypots/status', getHoneypotStatus);
router.get('/logs/:containerId', fetchLogs);
router.post('/honeypots/logs/:honeypotName', fetchHoneypotLogs);
router.get('/honeypots/check-uploads/:containerID', checkForUploads);
router.get('/honeypots/alllogs/:containerId', fetchAllLogs); //Get all logs from docker individual honeypot 
router.get('/honeypots/logs',getLogs) //Get all filtered logs from Elkstack individually for every honeypot
router.get('/honeypots/search',searchHoneypots) //Partial search of honeypots
router.get('/honeypots/ContainerID', getContainerIDRoute) //Get container ID
module.exports = router;
