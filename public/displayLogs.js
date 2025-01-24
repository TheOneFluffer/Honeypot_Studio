// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Helper function to get query parameters from the URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Fetch logs for the specified honeypot and container ID
async function fetchLogs(containerId, honeypotName) {
    try {
        // API call using POST method
        const response = await fetch(`${apiUrl}/api/logs/${containerId}?honeypot_name=${honeypotName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            displayLogs(data.logs); // Pass logs to the displayLogs function
        } else {
            console.error("Error fetching logs:", response.statusText);
            displayLogs(["Failed to fetch logs."]);
        }
    } catch (error) {
        console.error("Error:", error);
        displayLogs(["An error occurred while fetching logs."]);
    }
}

// Fetch and display honeypot data on page load
async function fetchAndDisplayHoneypotData() {
    try {
        const honeypotName = getQueryParam("honeypotName"); // Extract honeypotName from URL
        const containerId = getQueryParam("containerId"); // Extract containerId from URL

        if (!honeypotName || !containerId) {
            console.error("Both honeypotName and containerId are required.");
            displayLogs(["Missing honeypot name or container ID in the query parameters."]);
            return;
        }

        // Update the honeypot name in the UI
        const honeypotNameElement = document.getElementById("honeypot-name");
        honeypotNameElement.textContent = honeypotName;

        // Call fetchLogs to fetch logs for the specified containerId
        await fetchLogs(honeypotName, containerId);
    } catch (error) {
        console.error("Error fetching honeypot data:", error);
        displayLogs(["Unable to fetch honeypot data."]);
    }
}

// Populate the logs in the textarea
// Populate the logs in the textarea
function displayLogs(logs) {
    const logTextbox = document.getElementById("log-textbox");
    logTextbox.value = ""; // Clear existing logs

    if (!logs || logs.length === 0) {
        logTextbox.value = "No logs available.";
        return;
    }

    // Convert each log to a readable string and populate the textarea
    logs.forEach(log => {
        if (typeof log === "object") {
            logTextbox.value += `${JSON.stringify(log, null, 2)}\n`; // Pretty-print object logs
        } else {
            logTextbox.value += `${log}\n`; // Append string logs directly
        }
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchAndDisplayHoneypotData();
});

// Optional: Refresh data periodically
setInterval(fetchAndDisplayHoneypotData, 30000); // Refresh every 30 seconds
