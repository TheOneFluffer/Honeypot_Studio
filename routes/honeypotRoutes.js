const express = require('express');
const {getHoneypots, deployHoneypotController, removeHoneypotController, getHoneypotStatus,fetchLogs,fetchHoneypotLogs, checkForUploads,fetchAllLogs,getLogs, searchHoneypots, getContainerIDRoute, startHoneypotController, stopHoneypotController, editHoneypotController, renameHoneypotController, getLogsHandler } = require('../controllers/honeypotController');
const router = express.Router();

// Routes

router.get('/honeypots', getHoneypots);
//router.put('/honeypots/:id', updateHoneypot);
router.post('/honeypots/deploy', deployHoneypotController);
router.delete('/honeypots/remove/:name/:containerID', removeHoneypotController); //remove honeypot, elk stack, mongodb
router.get('/honeypots/status', getHoneypotStatus);
router.get('/logs/:containerId', fetchLogs); // Allow user to grade severity of logs (NOT GIVING OF CRITIERIA)
//router.post('/logs/:containerId', fetchLogs); //Allows user to give criteria for severity of logs and grade logs according for the honeypots
router.post('/honeypots/logs/:honeypotName', fetchHoneypotLogs);
router.get('/honeypots/check-uploads/:containerID', checkForUploads); // check for file with .exe extension 
router.get('/honeypots/renamehoneypot', renameHoneypotController); //Rename Honeypot
// router.post('/honeypots/renamehoneypot', renameHoneypotController); //Rename Honeypot
router.get('/honeypots/alllogs/:containerId', fetchAllLogs); //Get all logs from docker individual honeypot 
router.get('/honeypots/logs',getLogs) //Get all filtered logs from Elkstack individually for every honeypot
router.get('/honeypots/search',searchHoneypots) //Partial search of honeypots
router.get('/honeypots/ContainerID', getContainerIDRoute) //Get container ID
router.post('/honeypots/start/:name',startHoneypotController ) // get honeypot running
router.post('/honeypots/stop/:name', stopHoneypotController) // stop honeypot running
router.put('/honeypots/edit', editHoneypotController); // editExistingHoneypot
router.get('/honeypots/checklogs',getLogsHandler) //Get all logs from all honeypot and filter according to keywords
module.exports = router;

