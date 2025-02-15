const Honeypot = require('../models/Honeypot');
const { deployHoneypot, removeHoneypot, startHoneypot, stopHoneypot, editExistingHoneypot } = require('../deploy/honeypotDeployment');
//const { logEvent } = require('../utils/logEvent');
const Docker = require('dockerode');
const { exec } = require('child_process');
const fs = require('fs');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const mongoose = require('mongoose');
const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');
const { execSync } = require('child_process'); // Add this line to import execSync
const {MongoClient} = require("mongodb");
const path = require('path');


// Get all honeypots
const getHoneypots = async (req, res) => {
    try {
        const honeypots = await Honeypot.find();
        res.status(200).json(honeypots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching honeypots', error });
    }
};

// Update honeypot by container name
const editHoneypotController = async (req, res) => {
    try {
        const honeypotConfig = req.body;
        const deploymentStatus = await editExistingHoneypot(honeypotConfig);
        res.status(200).json(deploymentStatus);
    } catch (error) {
        console.error('Update deployment error:', error.stack || error.message);
        res.status(500).json({
            message: 'Error updating honeypot',
            error: error.stack || error.message,
        });
    }
}

// Update honeypot by container name
const renameHoneypotController = async (req, res) => {
    const { oldName, newName } = req.query;

    if (!oldName || !newName) {
        return res.status(400).json({ error: "Both oldName and newName are required." });
    }
    const mongoURI = "mongodb://localhost:27017";
    const dbName = "honeypot-studio";
    const elasticURI = "http://localhost:9200";
    const esClient = new Client({ node: elasticURI });

    try {
        // Docker rename
        execSync(`docker rename ${oldName} ${newName}`);

        // Update logretention.txt and alert.txt
        const filesToUpdate = ["logretention.txt", "alert.txt"];
        filesToUpdate.forEach((file) => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, "utf8");
                const updatedContent = content.replace(new RegExp(oldName, "g"), newName);
                fs.writeFileSync(file, updatedContent, "utf8");
            }
        });

        // Rename severity file
        const oldSeverityFile = `severity_${oldName}.txt`;
        const newSeverityFile = `severity_${newName}.txt`;
        if (fs.existsSync(oldSeverityFile)) {
            fs.renameSync(oldSeverityFile, newSeverityFile);
        }

        // Update MongoDB
        const client = new MongoClient(mongoURI);
        await client.connect();
        const db = client.db(dbName);
        const honeypotsCollection = db.collection("honeypots");

        const updateResult = await honeypotsCollection.updateOne(
            { name: oldName },
            { $set: { name: newName } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: `No honeypot entry found with name: ${oldName}` });
        }

        await db.renameCollection(`logs_${oldName}`, `logs_${newName}`);
        await client.close();

        // Reindex in Elasticsearch
        const oldIndexName = `honeypot-logs-${oldName}`;
        const newIndexName = `honeypot-logs-${newName}`;

        const indexExists = await esClient.indices.exists({ index: oldIndexName });
        if (!indexExists) {
            return res.status(404).json({ error: `Elasticsearch index ${oldIndexName} does not exist.` });
        }

        await esClient.reindex({
            body: {
                source: { index: oldIndexName },
                dest: { index: newIndexName }
            },
            wait_for_completion: true
        });

        await esClient.indices.delete({ index: oldIndexName });

        // Process logs and add filtered logs to the new index
        const alertFile = "alert.txt";
        if (!fs.existsSync(alertFile)) {
            return res.status(404).json({ message: "Alert file not found." });
        }

        const alertData = fs.readFileSync(alertFile, "utf8");
        const alertLines = alertData.split("\n").filter(line => line.trim() !== "");
        const honeypotEntry = alertLines.find(line => line.startsWith(`${newName}:`));
        if (!honeypotEntry) {
            return res.status(400).json({ message: `Honeypot '${newName}' not found in alert.txt.` });
        }

        const severities = honeypotEntry.split(":")[1].split(",").map(s => s.trim());
        const severityFile = `severity_${newName}.txt`;
        if (!fs.existsSync(severityFile)) {
            return res.status(404).json({ message: `Severity file for ${newName} not found.` });
        }

        const severityData = JSON.parse(fs.readFileSync(severityFile, "utf8"));
        const filteredLogs = severityData.filter(log => severities.includes(log.severity));

        if (filteredLogs.length === 0) {
            return res.status(404).json({ message: `No logs match the specified severities for '${newName}'.` });
        }

        // Insert filtered logs into the new Elasticsearch index
        const bulkBody = filteredLogs.flatMap(log => [
            { index: { _index: newIndexName } },
            log
        ]);

        await esClient.bulk({ body: bulkBody });

        res.json({
            message: `Honeypot renamed successfully.`
        });
    } catch (error) {
        // res.status(500).json({ error: `Error renaming honeypot: ${error.message}` });
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

const removeHoneypotController = async (req, res) => {
    try {
        const { containerID, name: containerName } = req.params;

        if (!containerID || !containerName) {
            return res.status(400).json({ message: 'containerID and containerName are required' });
        }

        const removalStatus = await removeHoneypot(containerID, containerName);
        res.status(200).json(removalStatus);
    } catch (error) {
        console.error('Error in removeHoneypotController:', error);
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

// Provide the grading function for logs by default
const fetchLogs = async (req, res) => {
    const { containerId } = req.params; // Extract container ID from the request
    const { honeypot_name } = req.query; // Extract honeypot name from the query parameters

    if (!honeypot_name) {
        return res.status(400).json({ message: 'Honeypot name is required as a query parameter.' });
    }

    try {
        // Check if the container ID is '3be178edca01', and use the specific command for that container
        const command = containerId === '06b2910db9e2'
            // const command = containerId === 'c82733abe016' 
            ? `docker exec ${containerId} cat /opt/dionaea/var/log/dionaea/dionaea.log`
            // ? `docker exec ${containerId} cat admin:///var/lib/docker/containers/c82733abe0169404e9805864e086956e1c4dbeec581fd4abc8900fe495fc12d3`
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
// Allow the user to specify the severity function 
/*const fetchLogs = async (req, res) => {
    const { containerId } = req.params; // Extract container ID from the request
    const { honeypot_name } = req.query; // Extract honeypot name from the query parameters
    const { severityRules } = req.body; // Extract user-defined severity rules from the request body

    if (!honeypot_name) {
        return res.status(400).json({ message: 'Honeypot name is required as a query parameter.' });
    }

    if (!severityRules || typeof severityRules !== 'object') {
        return res.status(400).json({ message: 'Severity rules must be provided as a valid JSON object in the request body.' });
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
                    severity: gradeSeverity(log, severityRules),
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

// Dynamic Severity Grading Function
function gradeSeverity(log, severityRules) {
    for (const [severity, keywords] of Object.entries(severityRules)) {
        const regex = new RegExp(keywords.join('|'), 'i');
        if (regex.test(log)) {
            return severity;
        }
    }
    return 'Low'; // Default severity if no rule matches
}*/

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

/*const checkForUploads = (req, res) => {
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
};*/
// Define the log schema
const logSchema = new mongoose.Schema({
    containerID: { type: String, required: true },
    files: { type: [String], required: true },
    exeFiles: { type: [String], required: true },
    timestamp: { type: Date, default: Date.now }
});

// Create the Log model
const Log = mongoose.model('Log', logSchema);

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

        // Create a new log entry
        const newLog = new Log({
            containerID,
            files,
            exeFiles
        });

        // Save the log to the database
        newLog.save()
            .then(() => console.log('Log saved successfully'))
            .catch(err => console.error('Error saving log:', err));

        // Return the list of all uploaded files and the message
        return res.status(200).json({
            message: responseMessage,
            files: files,
            exeFiles: exeFiles.length > 0 ? exeFiles : undefined
        });
    });
};
const fetchAllLogs = async (req, res) => {
    const { containerId, containerName } = req.params;

    // Ensure either containerId or containerName is provided
    if (!containerId && !containerName) {
        return res.status(400).json({ error: 'Container ID or Container Name is required' });
    }

    // Determine the container identifier (either ID or Name)
    const containerIdentifier = containerId || containerName;

    exec(`sudo docker logs ${containerIdentifier}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error fetching logs: ${error.message}`);
            return res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
        }

        // Log warnings, but do not fail the API response
        if (stderr) {
            console.warn(`stderr: ${stderr}`);
        }

        // Send the logs as the response, including stderr if desired
        res.status(200).json({ logs: stdout, warnings: stderr || null });
    });
};


// Elasticsearch configuration
const ELASTICSEARCH_URL = 'http://localhost:9200'; // Base URL for Elasticsearch

const getLogs = async (req, res) => {
    const { index } = req.query; // Extract the index name from query parameters

    if (!index) {
        return res.status(400).json({ error: 'Missing required "index" query parameter' });
    }

    try {
        // Query Elasticsearch to get logs from the specified index
        const response = await axios.post(
            `${ELASTICSEARCH_URL}/${index}/_search?pretty`, // Use the user-provided index
            {
                query: {
                    match_all: {}, // Retrieve all logs
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        // Send back the logs to the client
        res.status(200).json(response.data.hits.hits); // Return the logs
    } catch (error) {
        console.error('Error retrieving logs:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

/*  // Define an async function to list Docker containers and their details
const listDockerHoneypots = async () => {
    return new Promise((resolve, reject) => {
      // Run the Docker command to list containers with their names, statuses, ports, and images
      exec(
        'docker ps -a --format "{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}|{{.Networks}}"',
        (error, stdout, stderr) => {
          if (error) {
            return reject(`Error: ${stderr || error.message}`);
          }
  
          // Parse the output into an array of objects with name, status, ports, image, and networks
          const containers = stdout
            .trim()
            .split('\n')
            .map(line => {
              const [name, status, ports, image, networks] = line.split('|');
              return { 
                name: name.trim(),
                status: status.trim(),
                ports: ports.trim(),
                image: image.trim(),
                networks: networks.trim()
              };
            });
  
          resolve(containers);
        }
      );
    });
  };
  
  // Function to search honeypots by name, ports, image, or networks (supports partial match)
  const searchHoneypots = async (req, res) => {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
  
    try {
      // Retrieve the list of honeypots (Docker containers)
      const honeypots = await listDockerHoneypots();
  
      // Perform a case-insensitive partial search on all relevant fields
      const results = honeypots.filter(honeypot =>
        Object.values(honeypot).some(field =>
          field.toLowerCase().includes(query.toLowerCase())
        )
      );
  
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: `Failed to retrieve honeypots: ${error}` });
    }
  };*/
// Define an async function to list Docker containers and their details
const listDockerHoneypots = async () => {
    return new Promise((resolve, reject) => {
        exec(
            'docker ps -a --format "{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}|{{.Networks}}"',
            (error, stdout, stderr) => {
                if (error) {
                    return reject(`Error: ${stderr || error.message}`);
                }

                const containers = stdout
                    .trim()
                    .split('\n')
                    .map(line => {
                        const [name, status, ports, image, networks] = line.split('|');
                        return {
                            name: name.trim(),
                            status: status.trim(),
                            ports: ports.trim(),
                            image: image.trim(),
                            networks: networks.trim(),
                        };
                    });

                resolve(containers);
            }
        );
    });
};

// Function to search honeypots by name, ports, image, networks, or MongoDB fields
const searchHoneypots = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        // Retrieve the list of Docker containers
        const dockerHoneypots = await listDockerHoneypots();

        // Perform a case-insensitive partial search in Docker container details
        const dockerResults = dockerHoneypots.filter(honeypot =>
            Object.values(honeypot).some(field =>
                field.toLowerCase().includes(query.toLowerCase())
            )
        );

        if (dockerResults.length > 0) {
            return res.json(dockerResults);
        }

        // If no match is found in Docker details, search in MongoDB
        const mongoResults = await Honeypot.find({
            $or: [
                { deploymentLocation: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } },
            ],
        }).lean();

        res.json(mongoResults);
    } catch (error) {
        res.status(500).json({ error: `Failed to retrieve honeypots: ${error}` });
    }
};

//Get container ID
const getContainerIDRoute = (req, res) => {
    const { containerName } = req.query; // Extract container name from query parameter

    if (!containerName) {
        return res.status(400).json({ error: 'Container name is required' });
    }

    try {
        // Run the docker command to get the container ID synchronously
        const command = `docker ps -q --filter "name=${containerName}"`;
        const containerID = execSync(command).toString().trim();

        if (!containerID) {
            return res.status(404).json({ error: `No container found with name: ${containerName}` });
        }

        res.json({ containerID }); // Send the container ID as a JSON response
    } catch (error) {
        res.status(500).json({ error: `Error executing Docker command: ${error.message}` }); // Handle errors
    }
};

// Start Honeypot Endpoint
const startHoneypotController = async (req, res) => {
    try {
        const { name } = req.params; // Expect container name
        const startStatus = await startHoneypot(name);
        res.status(200).json(startStatus);
    } catch (error) {
        res.status(500).json({
            message: 'Error starting honeypot',
            error: error.stack || error.message,
        });
    }
};

// Stop Honeypot Endpoint
const stopHoneypotController = async (req, res) => {
    try {
        const { name } = req.params; // Expect container name
        const stopStatus = await stopHoneypot(name);
        res.status(200).json(stopStatus);
    } catch (error) {
        res.status(500).json({ message: 'Error stopping honeypot', error });
        res.status(500).json({
            message: 'Error stopping honeypot',
            error: error.stack || error.message,
        });
    }
};

/**
 * Reads all log files, filters logs with suspicious keywords, and returns results.
 */
/*
// Ensure this is the correct directory
const LOGS_DIR = "/home/fyp/Downloads/Honeypot_Studio-main_latest/Backend";

// Keywords to filter
const FILTER_KEYWORDS = [
    ".exe",  // Only filter out .exe extensions, not "execute"
    "exploit",
    "attack",
    "malware",
    "payload",
    "unrecognized",
];

/**
 * Reads all log files, filters logs with suspicious keywords, and returns results.
 */
/*const getFilteredLogs = () => {
    const flaggedLogs = [];

    try {
        // Read log directory
        const files = fs.readdirSync(LOGS_DIR);
        console.log("Found files:", files); // Debugging

        files.forEach((file) => {
            if (file.startsWith("severity_") && file.endsWith(".txt")) {
                const honeypotName = file.replace("severity_", "").replace(".txt", ""); // Extract honeypot name
                const filePath = path.join(LOGS_DIR, file);

                console.log(`Processing file: ${filePath}`); // Debugging

                const logs = fs.readFileSync(filePath, "utf8").split("\n"); // Read logs

                // Filter logs containing suspicious keywords
                logs.forEach((log) => {
                    // Only match exact .exe extension, not words like "execute"
                    if (FILTER_KEYWORDS.some((keyword) => {
                        // Handle .exe case separately to avoid false positive with "execute"
                        if (keyword === ".exe") {
                            return /\b\.exe\b/.test(log.toLowerCase()); // Match exactly .exe, not execute
                        }
                        return log.toLowerCase().includes(keyword); // Other keywords can match anywhere
                    })) {
                        flaggedLogs.push({ honeypot: honeypotName, log });
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error reading logs:", error);
    }

    return flaggedLogs;
};

// API route to get filtered logs
const getLogsHandler = (req, res) => {
    try {
        console.log("Request received at /logs"); // Debugging

        const flaggedLogs = getFilteredLogs();
        if (flaggedLogs.length === 0) {
            return res.status(200).json({ message: "No suspicious activity detected." });
        }
        res.status(200).json({ flagged_logs: flaggedLogs });
    } catch (error) {
        console.error("Error in API handler:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};*/

// Ensure this is the correct directory
const LOGS_DIR = "/home/fyp/Downloads/Honeypot_Studio-main_latest/Backend";

// Extended Keywords to filter
const FILTER_KEYWORDS = [
    ".exe",  // Only filter out .exe files
    "exploit",
    "attack",
    "malware",
    "payload",
    "unrecognized"  // New keyword added
];

/**
 * Reads all log files, filters logs with suspicious keywords, and returns results.
 */
const getFilteredLogs = () => {
    const flaggedLogs = [];

    try {
        // Read log directory
        const files = fs.readdirSync(LOGS_DIR);
        console.log("Found files:", files); // Debugging

        files.forEach((file) => {
            if (file.startsWith("severity_") && file.endsWith(".txt")) {
                const honeypotName = file.replace("severity_", "").replace(".txt", ""); // Extract honeypot name
                const filePath = path.join(LOGS_DIR, file);

                console.log(`Processing file: ${filePath}`); // Debugging

                const logs = fs.readFileSync(filePath, "utf8").split("\n"); // Read logs

                // Filter logs containing suspicious keywords
                logs.forEach((log) => {
                    // Only match exact .exe extension, not words like "execute"
                    if (FILTER_KEYWORDS.some((keyword) => {
                        // Handle .exe case separately to avoid false positive with "execute"
                        if (keyword === ".exe") {
                            return /\b\.exe\b/.test(log.toLowerCase()); // Match exactly .exe, not execute
                        }
                        return log.toLowerCase().includes(keyword); // Other keywords can match anywhere
                    })) {
                        flaggedLogs.push({ honeypot: honeypotName, log });
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error reading logs:", error);
    }

    return flaggedLogs;
};

// API route to get filtered logs
const getLogsHandler = (req, res) => {
    try {
        console.log("Request received at /logs"); // Debugging

        const flaggedLogs = getFilteredLogs();
        if (flaggedLogs.length === 0) {
            return res.status(200).json({ message: "No suspicious activity detected." });
        }
        res.status(200).json({ flagged_logs: flaggedLogs });
    } catch (error) {
        console.error("Error in API handler:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




module.exports = {
    getHoneypots,
    editHoneypotController,
    deployHoneypotController,
    removeHoneypotController,
    getHoneypotStatus,
    fetchLogs,
    fetchHoneypotLogs,
    checkForUploads,
    fetchAllLogs,
    getLogs,
    searchHoneypots,
    getContainerIDRoute,
    startHoneypotController,
    stopHoneypotController,
    renameHoneypotController,
    getLogsHandler
};
