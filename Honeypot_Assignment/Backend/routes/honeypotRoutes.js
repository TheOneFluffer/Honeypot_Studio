const express = require('express');
const { createHoneypot, getHoneypots, updateHoneypot, deleteHoneypot, deployHoneypotController, removeHoneypotController, getHoneypotStatus } = require('../controllers/honeypotController');
const router = express.Router();

// Routes
router.post('/honeypots', createHoneypot);
router.get('/honeypots', getHoneypots);
router.put('/honeypots/:id', updateHoneypot);
router.delete('/honeypots/:id', deleteHoneypot);
router.post('/honeypots/deploy', deployHoneypotController);
router.delete('/honeypots/remove/:name', removeHoneypotController);
router.get('/honeypots/status', getHoneypotStatus);

module.exports = router;
