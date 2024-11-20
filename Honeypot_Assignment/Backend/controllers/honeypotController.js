const Honeypot = require('../models/Honeypot');
const { deployHoneypot, removeHoneypot } = require('../deploy/honeypotDeployment');

const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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

module.exports = {
    createHoneypot,
    getHoneypots,
    updateHoneypot,
    deleteHoneypot,
    deployHoneypotController,
    removeHoneypotController,
    getHoneypotStatus,
};
