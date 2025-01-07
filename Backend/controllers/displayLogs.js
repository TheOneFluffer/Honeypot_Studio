async function fetchAndDisplayLogs() {
    // Get the honeypotId from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const honeypotId = urlParams.get('honeypotId');

    // Check if honeypotId is provided
    if (!honeypotId) {
        console.error('No Honeypot ID provided in the URL.');
        document.getElementById('log-textbox').value = 'No Honeypot ID provided.';
        return;
    }

    try {
        console.log(`Fetching logs for Honeypot ID: ${honeypotId}`); // Debugging line
        
        // Fetch logs from the backend API
        const response = await fetch(`http://localhost:3001/api/docker/logs/${honeypotId}`);
        if (!response.ok) {
            throw new Error(`Error fetching logs: ${response.status}`);
        }

        // Parse the JSON response
        const data = await response.json();
        console.log(data);  // Debugging line to see the structure of the response

        // Display the logs in the log textbox
        const logTextbox = document.getElementById('log-textbox');
        if (data.logs && Array.isArray(data.logs)) {
            logTextbox.value = data.logs.join('\n'); // Display logs separated by new lines
        } else {
            logTextbox.value = 'No logs available for this honeypot.';
        }
    } catch (error) {
        // Handle errors
        console.error('Error fetching logs:', error);
        const logTextbox = document.getElementById('log-textbox');
        logTextbox.value = 'Error fetching logs. Please try again later.';
    }
}

// Fetch and display logs when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayLogs);
