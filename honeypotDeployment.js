const Docker = require('dockerode');
const Honeypot = require('../models/Honeypot');
const path = require('path');
const  {createLogModel} = require('../models/HoneypotLog')
const { exec, execSync } = require("child_process");
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const fs = require('fs'); // To handle file operations
// Helper function to simulate sleep/delay
// Function to pull a Docker image with retry logic
const pullDockerImageWithRetry = async (image, retries = 3, delay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting to pull Docker image: ${image} (Attempt ${attempt}/${retries})`);
            await new Promise((resolve, reject) => {
                exec(`docker pull ${image}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error pulling image: ${stderr}`);
                        return reject(error);
                    }
                    console.log(`Image pulled successfully: ${stdout}`);
                    resolve();
                });
            });
            return; // Exit function if successful
        } catch (error) {
            if (attempt < retries) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await sleep(delay); // Wait before retrying
            } else {
                console.error(`Failed to pull Docker image after ${retries} attempts`);
                throw error;
            }
        }
    }
};

// Main deployHoneypot function
const deployHoneypot = async (honeypotConfig) => {
    try {
        const { name, type, image, networkInterface, lastOctet, logRetention, honeynet, deploymentLocation, alert } = honeypotConfig;

        // Validate the network interface, last octet, and ports
        if (!networkInterface || !lastOctet) {
            throw new Error("Both IP address and network interface must be specified.");
        }

        // Ensure ports is an array, even if it's a single port
        let ports = honeypotConfig.ports;
        if (!Array.isArray(ports)) {
            ports = [ports]; // Convert single port into an array
        }

        // Validate the ports array
        if (ports.some(port => typeof port !== 'number')) {
            throw new Error("Invalid 'ports' parameter. It must be an array of numbers.");
        }

        // Calculate the full IP address
        const baseIP = "192.168.198";
        const IP = `${baseIP}.${lastOctet}`;
        console.log(`Calculated IP: ${IP} for network interface: ${networkInterface}`);

        // Update the system's static IP for the specified interface using nmcli
        try {
            console.log(`Assigning static IP ${IP} to ${networkInterface} using nmcli`);
            execSync(`nmcli connection modify ${networkInterface} ipv4.method manual ipv4.addresses ${IP}/24 ipv4.gateway 192.168.198.1 ipv4.dns 8.8.8.8`);
            execSync(`nmcli connection down ${networkInterface}`);
            execSync(`nmcli connection up ${networkInterface}`);
            console.log(`Static IP ${IP} assigned successfully to ${networkInterface}`);
        } catch (error) {
            throw new Error(`Failed to assign static IP using nmcli: ${error.message}`);
        }

        // Pull the Docker image with retry logic
        console.log(`Pulling Docker image: ${image}`);
        await pullDockerImageWithRetry(image);

        let container;
        if (ports.length > 1) {
            // Use containerOptions for multiple ports
            const containerOptions = {
                Image: honeypotConfig.image || 'ubuntu:latest',
                Cmd: honeypotConfig.cmd || ['/bin/bash'],
                ExposedPorts: ports.reduce((acc, port) => {
                    acc[`${port}/tcp`] = {};
                    return acc;
                }, {}),
                HostConfig: {
                    PortBindings: ports.reduce((acc, port) => {
                        acc[`${port}/tcp`] = [{ HostIP: IP, HostPort: `${port}` }];
                        return acc;
                    }, {}),
                },
            };

            console.log(`Creating container with options: ${JSON.stringify(containerOptions, null, 2)}`);
            container = await docker.createContainer(containerOptions);
        } else {
            // Handle single port scenario
            const port = ports[0];
            console.log(`Creating container for single port: ${port}`);
            container = await docker.createContainer({
                Image: image,
                name: name,
                ExposedPorts: {
                    [`${port}/tcp`]: {},
                },
                HostConfig: {
                    PortBindings: {
                        [`${port}/tcp`]: [{ HostIP: `${IP}`, HostPort: `${port}` }],
                    },
                },
            });
        }

        console.log(`Starting container: ${name}`);
        await container.start();

        console.log(`Honeypot ${name} deployed successfully on ports ${ports.join(", ")}`);

        // Save honeypot details to MongoDB
        const honeypot = await Honeypot.findOneAndUpdate(
            { name },
            {
                name,
                type,
                image,
                ports, // Save ports array
                IP,
                networkInterface,
                logRetention,
                honeynet,
                deploymentLocation,
                alert,
                status: "deployed",
                updatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log("Honeypot details saved to database:", honeypot);

        // Dynamically create a log schema and collection for deployed honeypot
        const LogModel = createLogModel(name);
        console.log(`Log schema created for honeypot: logs_${name}`);

        // Save logRetention to logretention.txt
        if (logRetention) {
            fs.appendFileSync('logretention.txt', `${name}: ${logRetention}\n`, 'utf8');
            console.log(`Log retention value saved to logretention.txt for honeypot: ${name}`);
        }

        // Save alert to alert.txt
        if (alert) {
            fs.appendFileSync('alert.txt', `${name}: ${alert}\n`, 'utf8');
            console.log(`Alert value saved to alert.txt for honeypot: ${name}`);
        }

        return { status: "deployed", name, type, ports, image, IP, logRetention, honeynet, deploymentLocation, alert };
    } catch (error) {
        console.error("Error deploying honeypot:", error);
        throw new Error(error.message || "Failed to deploy honeypot");
    }
};




// Stop and remove a honeypot container
/*const removeHoneypot = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        console.log(`Stopping container: ${containerName}`);
        await container.stop();

        console.log(`Removing container: ${containerName}`);
        await container.remove();

        console.log(`Honeypot ${containerName} removed successfully`);

        // Delete the honeypot's details from the database
        const deletedHoneypot = await Honeypot.findOneAndDelete({ name: containerName });

        if (!deletedHoneypot) {
            console.warn(`Honeypot ${containerName} not found in database`);
        } else {
            console.log('Honeypot details deleted from database:', deletedHoneypot);
        }

        // Use the existing log model to drop the collection
        const LogModel = createLogModel(containerName); // Use the pre-existing log model
        await LogModel.collection.drop(); // Drop the logs collection for this honeypot

        console.log(`Logs collection for honeypot ${containerName} dropped`);

        return { status: 'removed', name: containerName };
    } catch (error) {
        console.error('Error removing honeypot:', error);
        throw new Error('Failed to remove honeypot');
    }
};*/

const removeLinesFromFile = async (filePath, pattern) => {
    try {
        // Read the content of the file
        const fileContent = await fs.readFile(filePath, { encoding: 'utf8' });

        // Split the content into lines and filter out lines containing the pattern
        const lines = fileContent.split('\n');
        const filteredLines = lines.filter(line => !line.includes(pattern));

        // Write the filtered lines back to the file
        await fs.writeFile(filePath, filteredLines.join('\n'), 'utf8');

        console.log(`Removed lines containing "${pattern}" from ${filePath}`);
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
        throw err;
    }
};
const removeHoneypot = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        console.log(`Stopping container: ${containerName}`);
        await container.stop();

        console.log(`Removing container: ${containerName}`);
        await container.remove();

        console.log(`Honeypot ${containerName} removed successfully`);

        const deletedHoneypot = await Honeypot.findOneAndDelete({ name: containerName });
        if (!deletedHoneypot) {
            console.warn(`Honeypot ${containerName} not found in database`);
        } else {
            console.log('Honeypot details deleted from database:', deletedHoneypot);
        }

        const LogModel = createLogModel(containerName);
        await LogModel.collection.drop();
        console.log(`Logs collection for honeypot ${containerName} dropped`);

        // Remove lines related to the honeypot from logretention.txt and alert.txt
        const logRetentionPattern = `${containerName}:`;
        const alertPattern = `${containerName}:`;

        await removeLinesFromFile('logretention.txt', logRetentionPattern);
        await removeLinesFromFile('alert.txt', alertPattern);

        console.log(`Data related to honeypot ${containerName} removed from logretention.txt and alert.txt`);

        // Delete severity_{containerName}.txt
        const severityFilePath = path.join('/home/fyp/honeypot_studio_backend', `severity_${containerName}.txt`);
        if (fs.existsSync(severityFilePath)) {
            fs.unlinkSync(severityFilePath);
            console.log(`File severity_${containerName}.txt deleted`);
        } else {
            console.warn(`File severity_${containerName}.txt not found`);
        }

        return { status: 'removed', name: containerName };
    } catch (error) {
        console.error('Error removing honeypot:', error);
        throw new Error('Failed to remove honeypot');
    }
};

module.exports = { deployHoneypot, removeHoneypot };
