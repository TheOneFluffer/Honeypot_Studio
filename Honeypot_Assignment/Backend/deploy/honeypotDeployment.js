const Docker = require('dockerode');
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
        return { status: 'removed', name: containerName };
    } catch (error) {
        console.error('Error removing honeypot:', error);
        throw new Error('Failed to remove honeypot');
    }
};

module.exports = { deployHoneypot, removeHoneypot };
