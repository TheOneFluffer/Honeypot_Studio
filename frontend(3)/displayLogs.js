// const express = require('express');
// // const { exec } = require('child_process');
// // const app = express();

// // Function to fetch logs from the backend API
// async function fetchLogs() {
//     try {
//         const response = await fetch('http://localhost:5000/api/logs?container=cows'); // Replace with your backend URL
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const logs = await response.text();
//         document.getElementById('log-textbox').value = logs; // Update the textbox with logs
//     } catch (error) {
//         console.error('Error fetching logs:', error);
//         document.getElementById('log-textbox').value = 'Error fetching logs. Please check the console for details.';
//     }
// }

// // Fetch logs every 5 seconds (adjust as needed)
// setInterval(fetchLogs, 5000);

// // Fetch logs once on page load
// fetchLogs();


const express = require('express');
const Docker = require('dockerode');
const app = express();
const port = 7000;

// Initialize Docker client
const docker = new Docker();

app.get('/api/logs', async (req, res) => {
    const containerName = 'cows'; // The container name
    try {
        const container = docker.getContainer(containerName);

        // Fetch logs from the container
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            timestamps: true,
        });

        // Convert logs buffer to a string and send them
        res.send(logs.toString('utf8'));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
    }
});

async function fetchLogs() {
    try {
        // Update the API URL to point to the correct backend and endpoint
        const response = await fetch('http://localhost:5000/api/logs');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const logs = await response.text();
        // Display the logs in the textarea
        document.getElementById('log-textbox').value = logs;
    } catch (error) {
        console.error('Error fetching logs:', error);
        document.getElementById('log-textbox').value = 'Error fetching logs. Please check the console for details.';
    }
}

// Fetch logs periodically (e.g., every 5 seconds)
setInterval(fetchLogs, 5000);

// Fetch logs immediately on page load
fetchLogs();


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
