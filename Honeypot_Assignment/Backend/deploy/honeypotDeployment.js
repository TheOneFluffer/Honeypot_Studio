const Docker = require('dockerode');
const Honeypot = require('../models/Honeypot');
const path = require('path');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Deploy a honeypot container
const deployHoneypot = async (honeypotConfig) => {
    console.log('Received honeypot configuration:', honeypotConfig);
    try {
        const { name, type, port, image, config = {} } = honeypotConfig;

        // Pull the Docker image
        console.log(`Pulling Docker image: ${image}`);
        await new Promise((resolve, reject) => {
            docker.pull(image, (err, stream) => {
                if (err) return reject(err);
                docker.modem.followProgress(
                    stream,
                    (err, output) => (err ? reject(err) : resolve(output)),
                    (event) => console.log(event.status)
                );
            });
        });

        // Define environment variables or volumes if needed
        const hostConfig = {
            PortBindings: {
                [`${port}/tcp`]: [{ HostPort: `${port}` }],
            },
        };

        if (config && config.volumes) {
            hostConfig.Binds = config.volumes; // e.g., ["host/path:/container/path"]
        }

        const environmentVariables = config.env || []; // Use empty array if no environment variables

        // Create and start the container
        const container = await docker.createContainer({
            Image: image,
            name: name,
            ExposedPorts: {
                [`${port}/tcp`]: {},
            },
            HostConfig: hostConfig,
            Env: config && config.env ? config.env : [],
        });

        console.log(`Starting container: ${name}`);
        await container.start();

        console.log(`Honeypot ${name} deployed successfully on port ${port}`);

        // Save deployment details to MongoDB
        const honeypot = await Honeypot.findOneAndUpdate(
            { name }, // Match based on honeypot name
            {
                name,
                type,
                image,
                port,
                status: 'deployed',
                updatedAt: new Date(),
            },
            { upsert: true, new: true } // Create a new record if not found
        );

        console.log('Honeypot details saved to database:', honeypot);

        return { status: 'deployed', name, type, port, image };
    } catch (error) {
        console.error('Error deploying honeypot:', error);
        throw new Error(error.message || 'Failed to deploy honeypot');
    }
};

// Stop and remove a honeypot container
const removeHoneypot = async (containerName) => {
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

        return { status: 'removed', name: containerName };
    } catch (error) {
        console.error('Error removing honeypot:', error);
        throw new Error('Failed to remove honeypot');
    }
};

module.exports = { deployHoneypot, removeHoneypot };
