// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Global variable to store fetched honeypot data
let honeypotData = [];

// Function to get query parameter value by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to display honeypot data in a list format
function populateList(data) {
    const listContainer = document.querySelector("#honeypot-list"); // Assuming you have an element with this ID for the list
    listContainer.innerHTML = ""; // Clear previous content

    data.forEach(honeypot => {
        const listItem = `
            <div class="honeypot-item">
                <div style="display: flex; align-items: center; gap: 10px;">
    <h3 style="margin: 0;">${honeypot.name}</h3>
    <button class="btn btn-primary btn-sm" onclick="navigateTorenameHP('${honeypot.name}')">Edit Name</button>
</div>
                <ul>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Image:</strong> ${honeypot.image}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"<strong>Version:</strong> ${honeypot.__v}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Alert:</strong> ${honeypot.alert}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Type:</strong> ${honeypot.type}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Port:</strong> ${honeypot.ports}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>IP Address:</strong> ${honeypot.IP}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Network Interface:</strong> ${honeypot.networkInterface}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Honeynet:</strong> ${honeypot.honeynet}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Deployment Location:</strong> ${honeypot.deploymentLocation}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Log Retention:</strong> ${honeypot.logRetention}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Status:</strong> ${honeypot.status}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Created Date:</strong> ${new Date(honeypot.createdAt).toLocaleString()}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;"><strong>Updated Date:</strong> ${new Date(honeypot.updatedAt).toLocaleString()}</li>
                    <li style="display: flex; align-items: center; gap: 10px; margin: 10px;">
                        <button class="btn btn-success btn-sm" onclick="startHoneypot('${honeypot.name}')">Start</button>
                        <button class="btn btn-danger btn-sm" onclick="stopHoneypot('${honeypot.name}')">Stop</button>
                        <button class="btn btn-warning btn-sm" onclick="editHoneypot('${honeypot.name}')">Edit Details</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteHoneypot('${honeypot.name}')">Delete</button>
                        <button class="btn btn-info btn-sm" onclick="fetchLogsForHoneypot('${honeypot.name}')">View Log</button>
                        <button class="btn btn-info btn-sm" onclick="navigateToCVE('${honeypot.name}')">View CVEs</button>
                        <button class="btn btn-warning btn-sm" onclick="navigateToManageEdit()">Back</button>
                    </li>
                </ul>
            </div>
            <hr>
        `;
        listContainer.innerHTML += listItem;
    });
}

// Update the fetch function to call populateList instead of populateTable
async function fetchAndDisplayHoneypotData() {
    try {
        const response = await fetch(`${apiUrl}/api/honeypots`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const honeypotData = await response.json();

        // Get honeypotName from URL query parameter
        const honeypotName = getQueryParam("honeypotName");

        if (honeypotName) {
            // Filter for the specific honeypot
            const filteredHoneypot = honeypotData.filter(honeypot => honeypot.name === honeypotName);
            populateList(filteredHoneypot);
        } else {
            alert("No honeypot name specified in the URL.");
        }
    } catch (error) {
        console.error("Error fetching honeypot data:", error);
        alert("Failed to fetch honeypot data. Please check the API and try again.");
    }
}

// Fetch and display honeypot data on page load
fetchAndDisplayHoneypotData();

// Function to start a honeypot
async function startHoneypot(containerName) {
    const confirmed = confirm("Are you sure you want to start this honeypot?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${apiUrl}/api/honeypots/start/${containerName}`, {
            method: "POST",
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Stop API responded with an error. Status: ${response.status}, Error: ${errorText}`);
            alert(`Failed to start honeypot: ${errorText}`);
        } else {
            alert("Honeypot started successfully!");
        }

        // Refresh the table after deletion
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error starting honeypot:", error);
        alert(`Failed to start honeypot: ${error.message}`);
    }
}

// Function to stop a honeypot
async function stopHoneypot(containerName) {
    const confirmed = confirm("Are you sure you want to stop this honeypot?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${apiUrl}/api/honeypots/stop/${containerName}`, {
            method: "POST",
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Stop API responded with an error. Status: ${response.status}, Error: ${errorText}`);
            alert(`Failed to stop honeypot: ${errorText}`);
        } else {
            alert("Honeypot stop successfully!");
        }

        // Refresh the table after deletion
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error stopping honeypot:", error);
        alert(`Failed to stop honeypot: ${error.message}`);
    }
}

async function deleteHoneypot(containerName) {
    const confirmed = confirm("Are you sure you want to delete this honeypot?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${apiUrl}/api/honeypots/remove/${containerName}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Delete API responded with an error. Status: ${response.status}, Error: ${errorText}`);
            alert(`Failed to delete honeypot: ${errorText}`);
        } else {
            alert("Honeypot deleted successfully!");
        }

        // Refresh the table after deletion
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error deleting honeypot:", error);
        alert(`Failed to delete honeypot: ${error.message}`);
    }
}

const preElement = document.createElement("pre");
preElement.textContent = logs;
logDisplayArea.appendChild(preElement);

if (warnings) {
    const warningDiv = document.createElement("div");
    warningDiv.classList.add("warning");
    warningDiv.innerHTML = `<strong>Warnings:</strong><pre>${warnings}</pre>`;
    logDisplayArea.appendChild(warningDiv);
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const honeypotName = getQueryParam("honeypotName");
if (honeypotName) {
    // Use the honeypotName to fetch and display logs
    fetchLogs(honeypotName);
} else {
    console.error("Honeypot name is missing in the query parameter.");
}

// Function to display logs in the frontend
function displayLogs(logs, warnings) {
    const logDisplayArea = document.querySelector("#log-display-area"); // Assuming you have an element with this ID for logs

    // Clear existing logs
    logDisplayArea.innerHTML = "";

    // Display logs
    logDisplayArea.innerHTML += `<pre>${logs}</pre>`;

    // If there are warnings, display them as well
    if (warnings) {
        logDisplayArea.innerHTML += `<div class="warning"><strong>Warnings:</strong><pre>${warnings}</pre></div>`;
    }
}

// Function to redirect to displayLogs.html with honeypot name as a query parameter
function fetchLogsForHoneypot(honeypotName) {
    // Encode the honeypot name and container ID to handle special characters properly
    const encodedHoneypotName = encodeURIComponent(honeypotName);
    const encodedContainerId = encodeURIComponent(honeypotName);

    // Construct the URL with both honeypot name and container ID
    const url = `displayLogs.html?honeypotName=${encodedHoneypotName}&containerId=${encodedContainerId}`;
    window.location.href = url;
}

// Function to redirect to EditHP.html with honeypot name as a query parameter
function editHoneypot(honeypotName) {
    if (!honeypotName) {
        alert("Honeypot name is missing.");
        return;
    }

    // Encode the honeypot name to ensure special characters are handled properly
    const encodedHoneypotName = encodeURIComponent(honeypotName);

    // Construct the URL and redirect
    const url = `EditHP.html?honeypotName=${encodedHoneypotName}`;
    window.location.href = url;
}

// Call the function to fetch and display data
fetchAndDisplayHoneypotData();

// Get results displayed on the frontend after searching
function displayResults(results) {
    const container = document.getElementById("results-container");
    container.innerHTML = ""; // Clear previous results

    if (results.length === 0) {
        container.innerHTML = "<p>No honeypots found.</p>";
        return;
    }

    const list = document.createElement("ul");
    results.forEach(honeypot => {
        const item = document.createElement("li");
        item.textContent = honeypot.name;
        list.appendChild(item);
    });

    container.appendChild(list);
}

// Function to redirect to EditHP.html with honeypot name as a query parameter
function editHoneypot(honeypotName) {
    // Encode the honeypot name to ensure special characters are handled properly
    const encodedHoneypotName = encodeURIComponent(honeypotName);

    // Construct the URL and redirect
    const url = `EditHP.html?honeypotName=${encodedHoneypotName}`;
    window.location.href = url;
}

function navigateToManageEdit() {
    // Navigate to ManageEdit.html with the honeypot name as a query parameter
    const url = `ManageEdit.html`;
    window.location.href = url;
}

function navigateTorenameHP(honeypotName) {
    // Navigate to the specified URL format with the old honeypot name as query parameter
    const url = `renameHP.html?oldName=${encodeURIComponent(honeypotName)}`;
    window.location.href = url;
}

function navigateToCVE(honeypotName) {
    // Navigate to the specified URL format with the old honeypot name as query parameter
    const url = `CVEResults.html`;
    window.location.href = url;
}

// Optional: Refresh data periodically
setInterval(fetchAndDisplayHoneypotData, 30000); // Refresh every 30 seconds
