// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Helper function to get query parameters from the URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const honeypotName = getQueryParam("honeypotName");
if (honeypotName) {
    fetchLogs(honeypotName);
} else {
    console.error("Honeypot name is missing in the query parameter.");
}

let previousExeFiles = new Set(); // Track previously detected .exe files

async function fetchLogs(containerId, honeypotName) {
    try {
        // Fetch Logs API
        const response = await fetch(`${apiUrl}/api/logs/${containerId}?honeypot_name=${honeypotName}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            const data = await response.json();
            displayLogs(data.logs);
            checkForExeFiles(data.logs);
        } else {
            console.error("Error fetching logs:", response.statusText);
            displayLogs(["Failed to fetch logs."]);
        }
    } catch (error) {
        console.error("Error:", error);
        displayLogs(["An error occurred while fetching logs."]);
    }
}

function checkForExeFiles(logText) {
    try {
        if (!logText) return;

        const exeFiles = new Set(logText.match(/\b\S+\.exe\b/gi) || []);

        // Find new .exe files that haven't been alerted yet
        const newExeFiles = [...exeFiles].filter(file => !previousExeFiles.has(file));

        if (newExeFiles.length > 0) {
            alert(`Warning: New executable files detected in logs:\n${newExeFiles.join("\n")}`);
            newExeFiles.forEach(file => previousExeFiles.add(file)); // Mark as alerted
        }
    } catch (error) {
        console.error("Error checking logs:", error);
    }
}

// Refresh logs and check for .exe files every 5 seconds
setInterval(() => {
    if (honeypotName) fetchLogs(honeypotName);
}, 5000);