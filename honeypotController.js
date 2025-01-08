const Honeypot = require('../models/Honeypot');
const { deployHoneypot, removeHoneypot } = require('../deploy/honeypotDeployment');
const { logEvent } = require('../utils/logEvent');
const Docker = require('dockerode');
const {exec} = require('child_process');
const fs = require('fs');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const mongoose = require('mongoose');
const {Client} = require('@elastic/elasticsearch');

// Create a honeypot
const createHoneypot = async (req, res) => {
    try {
        const honeypot = new Honeypot(req.body);
        await honeypot.save();
        res.status(201).json(honeypot);
    } catch (error) {
        res.status(500).json({ message: 'Error creating honeypot', error });
    }
};

// Get all honeypots
const getHoneypots = async (req, res) => {
    try {
        const honeypots = await Honeypot.find();
        res.status(200).json(honeypots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching honeypots', error });
    }
};

// Update honeypot by ID
const updateHoneypot = async (req, res) => {
    try {
        const honeypot = await Honeypot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!honeypot) {
            return res.status(404).json({ message: 'Honeypot not found' });
        }
        res.status(200).json(honeypot);
    } catch (error) {
        res.status(500).json({ message: 'Error updating honeypot', error });
    }
};

// Delete honeypot by ID
const deleteHoneypot = async (req, res) => {
    try {
        const honeypot = await Honeypot.findByIdAndDelete(req.params.id);
        if (!honeypot) {
            return res.status(404).json({ message: 'Honeypot not found' });
        }
        res.status(200).json({ message: 'Honeypot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting honeypot', error });
    }
};

// Deploy a honeypot
const deployHoneypotController = async (req, res) => {
    try {
        const honeypotConfig = req.body; // Expect name, type, port, image
        const deploymentStatus = await deployHoneypot(honeypotConfig);
        res.status(200).json(deploymentStatus);
    } catch (error) {
        console.error('Deployment error:', error.stack || error.message);
        res.status(500).json({ 
            message: 'Error deploying honeypot', 
            error: error.stack || error.message, 
        });
    }
};

// Remove a honeypot
const removeHoneypotController = async (req, res) => {
    try {
        const { name } = req.params; // Expect container name
        const removalStatus = await removeHoneypot(name);
        res.status(200).json(removalStatus);
    } catch (error) {
        res.status(500).json({ message: 'Error removing honeypot', error });
        res.status(500).json({
            message: 'Error removing honeypot',
            error: error.stack || error.message,
        });
    }
};

// Get the status of running honeypots
const getHoneypotStatus = async (req, res) => {
    try {

        // Fetch query parameter for type filtering
        const { type } = req.query;

        console.log('Query parameter type:', type);

        // Fetch all running containers
        const containers = await docker.listContainers();

        // Filter containers with "honeypot" in their name
        const honeypots = containers
            .filter(container => container.Names.some(name => name.includes('honeypot')))
            .map(container => ({
                id: container.Id,
                name: container.Names[0].replace('/', ''), // Remove leading slash
                image: container.Image,
                status: container.Status,
                ports: container.Ports.map(port => ({
                    private: port.PrivatePort,
                    public: port.PublicPort,
                    type: port.Type,
                })),
            }));

        // Apply type filter if specified
        const filteredHoneypots = type
            ? honeypots.filter(honeypot =>
                  honeypot.image.toLowerCase().includes(type.toLowerCase())
              )
            : honeypots;
        
        console.log('Filtered honeypots:', filteredHoneypots);

        res.status(200).json({ honeypots: filteredHoneypots });
    } catch (error) {
        console.error('Error fetching honeypot status:', error);
        res.status(500).json({ message: 'Error fetching honeypot status', error });
    }
};
// API endpoint to log events for a specific honeypot
const logHoneypotEvent = async (req, res) => {
    console.log('Received request body:', req.body)
    const { name, event, sourceIP, details } = req.body;

    console.log('Received event for honeypot', name);

    try {
        await logEvent(name, { event, sourceIP, details });
        res.status(200).json({ message: 'Event logged successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging event', error });
    }
};
// API endpoint to start all honeypot containers
const startAllHoneypots = (req, res) => {
    // Command to get all containers with 'honeypot' in their name
    const command = 'docker start $(docker ps -a -q)';

    // Execute the command to get all honeypot container IDs
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error retrieving honeypots: ${error.message}`);
            return res.status(500).json({ message: 'Error retrieving honeypots', error: error.message });
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ message: 'Error retrieving honeypots', error: stderr });
        }

        // Split the output into individual container IDs
        const containerIds = stdout.split('\n').filter(id => id !== '');

        // Check if we have container IDs to start
        if (containerIds.length === 0) {
            return res.status(404).json({ message: 'No honeypot containers found.' });
        }

        console.log(`Found honeypot containers: ${containerIds.join(', ')}`);

        // Now start the containers
        const startCommand = `docker start ${containerIds.join(' ')}`;

        // Execute the command to start all honeypot containers
        exec(startCommand, (startError, startStdout, startStderr) => {
            if (startError) {
                console.error(`Error starting honeypots: ${startError.message}`);
                return res.status(500).json({ message: 'Error starting honeypots', error: startError.message });
            }

            if (startStderr) {
                console.error(`stderr: ${startStderr}`);
                return res.status(500).json({ message: 'Error starting honeypots', error: startStderr });
            }

            console.log(`Started honeypot containers: ${startStdout}`);
            res.status(200).json({ message: 'All honeypot containers started successfully.', details: startStdout });
        });
    });
};
const fetchLogs = async (req, res) => {
    const { containerId } = req.params; // Extract container ID from the request
    const { honeypot_name } = req.query; // Extract honeypot name from the query parameters

    if (!honeypot_name) {
        return res.status(400).json({ message: 'Honeypot name is required as a query parameter.' });
    }

    try {
        // Check if the container ID is '3be178edca01', and use the specific command for that container
        const command = containerId === '3be178edca01' 
            ? `docker exec ${containerId} cat /opt/dionaea/var/log/dionaea/dionaea.log`
            : `docker logs ${containerId}`;

        // Set maxBuffer size to 50MB (for large logs)
        const options = { maxBuffer: 200 * 1024 * 1024 };

        // Execute the command to fetch logs
        exec(command, options, (err, stdout, stderr) => {
            if (err) {
                console.error('Error executing command:', err);
                console.error('stderr:', stderr);
                return res.status(500).json({ message: 'Error fetching logs', error: stderr || err.message });
            } else {
                console.log('stdout:', stdout);

                // Process the logs
                const logs = stdout.split('\n').filter(log => log.trim() !== '');
                const gradedLogs = logs.map(log => ({
                    log,
                    severity: gradeSeverity(log),
                }));

                // Save the graded logs to a file
                const filename = `severity_${honeypot_name}.txt`;
                fs.writeFile(filename, JSON.stringify(gradedLogs, null, 2), (writeErr) => {
                    if (writeErr) {
                        console.error('Error saving logs to file:', writeErr);
                    } else {
                        console.log(`Graded logs saved to ${filename}`);
                    }
                });

                // Respond with the graded logs
                res.status(200).json({ honeypot_name, containerId, logs: gradedLogs });
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: 'Unexpected error', error: error.message });
    }
};

// Severity grading function
function gradeSeverity(log) {
    if (/ransomware|exploit|malware/i.test(log)) return 'Critical';
    if (/brute force|DoS|vulnerability/i.test(log)) return 'High';
    if (/scan|enumeration|ftp|ssh|wget/i.test(log)) return 'Medium'; 
    return 'Low';
}

// Elasticsearch client
const esClient = new Client({
    node: 'http://localhost:9200', // Replace with your Elasticsearch endpoint
});

// Cache for MongoDB models
const honeypotModels = {};

// Function to get or create a dynamic MongoDB model
const getHoneypotModel = (honeypotName) => {
    const collectionName = `logs_${honeypotName}`; // Use the desired collection naming convention
    if (!honeypotModels[collectionName]) {
        const schema = new mongoose.Schema({
            honeypotName: String,
            severity: String,
            log: String,
            timestamp: { type: Date, default: Date.now },
        });

        honeypotModels[collectionName] = mongoose.model(collectionName, schema, collectionName); // Specify the collection name
    }
    return honeypotModels[collectionName];
};

// Fetch specific logs for a honeypot
const fetchHoneypotLogs = async (req, res) => {
    const { honeypotName } = req.params;

    try {
        // Validate input
        if (!honeypotName) {
            return res.status(400).json({ message: 'Please provide a honeypot name.' });
        }

        // Read alert.txt to find severities for the given honeypot
        const alertFile = 'alert.txt';
        if (!fs.existsSync(alertFile)) {
            return res.status(404).json({ message: 'Alert file not found.' });
        }

        const alertData = fs.readFileSync(alertFile, 'utf-8');
        const alertLines = alertData.split('\n').filter(line => line.trim() !== '');
        const honeypotEntry = alertLines.find(line => line.startsWith(`${honeypotName}:`));

        if (!honeypotEntry) {
            return res.status(400).json({ message: `Honeypot '${honeypotName}' not found in alert.txt.` });
        }

        // Extract severities for the honeypot
        const severities = honeypotEntry.split(':')[1].split(',').map(s => s.trim());
        if (severities.length === 0) {
            return res.status(400).json({ message: `No severities specified for '${honeypotName}' in alert.txt.` });
        }

        // Read logs from severity file
        const severityFile = `severity_${honeypotName}.txt`;
        if (!fs.existsSync(severityFile)) {
            return res.status(404).json({ message: `Severity file for ${honeypotName} not found.` });
        }

        const severityData = fs.readFileSync(severityFile, 'utf-8');
        const logs = JSON.parse(severityData);

        // Filter logs based on severities
        const filteredLogs = logs.filter(log => severities.includes(log.severity));

        if (filteredLogs.length === 0) {
            return res.status(404).json({ message: `No logs match the specified severities for '${honeypotName}'.` });
        }

        // Dynamic MongoDB model for the honeypot
        const LogModel = getHoneypotModel(honeypotName);

        // Dynamic Elasticsearch index for the honeypot
        const esIndex = `honeypot-logs-${honeypotName.toLowerCase()}`;

        for (const entry of filteredLogs) {
            // Save each log to MongoDB
            await LogModel.create({
                honeypotName,
                severity: entry.severity,
                log: entry.log,
            });

            // Send each log to Elasticsearch
            await esClient.index({
                index: esIndex,
                body: {
                    honeypotName,
                    severity: entry.severity,
                    log: entry.log,
                    timestamp: new Date(),
                },
            });
        }

        res.status(200).json({
            message: `Filtered logs for honeypot '${honeypotName}' saved in MongoDB (logs_${honeypotName}) and sent to Elasticsearch (${esIndex}) successfully.`,
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};
const checkForUploads = (req, res) => {
    // Get the container ID from the route parameter
    const containerID = req.params.containerID;

    if (!containerID) {
        return res.status(400).json({ error: 'Container ID is required' });
    }

    // Command to list files in the /opt/dionaea/var/lib/dionaea/ftp/root directory inside the container
    const command = `docker exec ${containerID} ls -lh /opt/dionaea/var/lib/dionaea/ftp/root`;

    // Execute the command
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to execute docker command', details: stderr });
        }

        if (stderr) {
            return res.status(500).json({ error: 'Error while listing files', details: stderr });
        }

        // Check if files are found
        if (!stdout) {
            return res.status(200).json({ message: 'No files uploaded in the directory' });
        }

        // Split the output into individual files and filter out empty lines
        const files = stdout.split('\n').filter(Boolean);

        // Check for .exe files
        const exeFiles = files.filter(file => file.endsWith('.exe'));

        // Prepare the response message
        let responseMessage = 'Files uploaded';

        // If .exe files are found, add an alert to the message
        if (exeFiles.length > 0) {
            responseMessage = 'Alert: .exe files uploaded';
        }

        // Return the list of all uploaded files and the message
        return res.status(200).json({
            message: responseMessage,
            files: files,
            exeFiles: exeFiles.length > 0 ? exeFiles : undefined
        });
    });
};



module.exports = {
    createHoneypot,
    getHoneypots,
    updateHoneypot,
    deleteHoneypot,
    deployHoneypotController,
    removeHoneypotController,
    getHoneypotStatus,
    logHoneypotEvent,
    startAllHoneypots,
    fetchLogs,
    fetchHoneypotLogs,
    checkForUploads
};
