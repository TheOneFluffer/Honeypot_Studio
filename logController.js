// controllers/logController.js
const Docker = require('dockerode');
const { createLogModel } = require('../models/HoneypotLog'); // Import the dynamic log schema
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// API to collect logs from Docker container and insert into MongoDB
const collectAndInsertLogs = async (req, res) => {
    try {
        const { honeypotName } = req.params; // Get honeypot name from the request parameter
        const container = docker.getContainer(honeypotName); // Get the container by honeypot name

        // Fetch the logs from the container
        const logs = await container.logs({
            stdout: true,   // Capture stdout
            stderr: true,   // Capture stderr
            follow: false,  // Don't keep the stream open
            tail: 100,      // Get the last 100 lines of logs (can be customized)
        });

        // Convert logs from buffer to string
        const logLines = logs.toString().split('\n');

        // Dynamically create the log model for this honeypot
        const LogModel = createLogModel(honeypotName);

        // Parse and insert each log entry into the MongoDB collection
        for (const line of logLines) {
            if (line.trim() === "") continue;

            // Parse the log line (simple example, you can customize it)
            const logEvent = {
                event: line,             // You can customize the extraction logic based on your log format
                sourceIP: 'unknown',     // Example placeholder, modify it based on your log structure
                details: { message: line }, // Store the log line itself as the details
            };

            // Insert the log entry into the corresponding MongoDB collection
            const logEntry = new LogModel(logEvent);
            await logEntry.save();
        }

        res.status(200).json({ message: `Logs from ${honeypotName} collected and inserted successfully` });
    } catch (error) {
        console.error('Error collecting and inserting logs:', error);
        res.status(500).json({ message: 'Error collecting and inserting logs', error: error.message });
    }
};

module.exports = { collectAndInsertLogs };
