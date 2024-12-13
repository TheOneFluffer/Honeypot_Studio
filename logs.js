const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const HoneypotLog = require('../models/honeypotLogs');
const elasticsearchClient = require('../config/elasticsearch');

const docker = new Docker ({socketPath: '/var/run/docker.sock'});

//Route: Transfer Logs to Elasticsearch
router.post('/transfer', async (req, res) => {
    const { honeypotName, containerId } = req.body;

    if (!honeypotName || !containerId) {
        return res.status(400).json({ error: 'Missing honeypotName or containerId' });
    }

    try {
        // Fetch logs from Docker container
        const container = docker.getContainer(containerId);
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: false,
        });

        // Save logs in MongoDB
        const logDocument = new HoneypotLog({ honeypotName, log: logs.toString() });
        await logDocument.save();

        // Transfer logs to Elasticsearch
        await elasticsearchClient.index({
            index: 'honeypot-logs',
            body: {
                timestamp: new Date(),
                honeypotName,
                logs: logs.toString(),
            },
        });

        return res.json({ message: 'Logs transferred successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error transferring logs' });
    }
});
module.exports=router;