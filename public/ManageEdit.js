// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Global variable to store fetched honeypot data
let honeypotData = [];

// Fetch and display data with global storage
async function fetchAndDisplayHoneypotData() {
    try {
        const response = await fetch(`${apiUrl}/api/honeypots`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        honeypotData = await response.json();
        populateTable(honeypotData);
    } catch (error) {
        console.error("Error fetching honeypot data:", error);
        alert("Failed to fetch honeypot data. Please check the API and try again.");
    }
}

// Populate table function remains unchanged
function populateTable(data) {
    const tableBody = document.querySelector("#honeypot-table tbody");
    tableBody.innerHTML = "";

    data.forEach(honeypot => {
        const row = `
            <tr>
                <td>${honeypot.name}</td>
                <td>${honeypot.image}</td>
                <td>${honeypot.type}</td>
                <td>${honeypot.ports}</td>
                <td>${honeypot.IP}</td>
                <td>${honeypot.honeynet}</td>
                <td>${honeypot.deploymentLocation}</td>              
                <td>
                    ${honeypot.status}
                    <button class="btn btn-primary btn-sm" onclick="startHoneypot('${honeypot.name}')">Start</button>
                    <button class="btn btn-primary btn-sm" onclick="stopHoneypot('${honeypot.name}')">Stop</button>
                </td>                
                <td>
                    <button class="btn btn-success btn-sm" onclick="showDetails('${honeypot.name}')">Show Details</button>
                    <button class="btn btn-warning btn-sm" onclick="editHoneypot('${honeypot.name}')">Edit Details</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteHoneypot('${honeypot.name}')">Delete</button>
                    <button class="btn btn-success btn-sm" onclick="fetchLogsForHoneypot('${honeypot.name}')">View Log</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}


// Search function
function searchHoneypots() {
    const query = document.getElementById("search-bar").value.toLowerCase();

    // Filter honeypot data
    const filteredData = honeypotData.filter(honeypot => {
        return (
            honeypot.name.toLowerCase().includes(query) ||
            honeypot.type.toLowerCase().includes(query) ||
            honeypot.ports.toString().includes(query)
        );
    });

    // Populate table with filtered data
    populateTable(filteredData);
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
            console.warn(`Start API responded with an error. Status: ${response.status}, Error: ${errorText}`);
            alert(`Failed to start honeypot: ${errorText}`);
        } else {
            alert("Honeypot started successfully!");
        }

        // Refresh the table after the action
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

function fetchLogsForHoneypot(honeypotName) {
    // Encode the honeypot name and container ID to handle special characters properly
    const encodedHoneypotName = encodeURIComponent(honeypotName);
    const encodedContainerId = encodeURIComponent(honeypotName);

    // Construct the URL with both honeypot name and container ID
    const url = `displayLogs.html?honeypotName=${encodedHoneypotName}&containerId=${encodedContainerId}`;
    window.location.href = url;
}

// Function to redirect to hpDetails.html with honeypot name as a query parameter
function showDetails(honeypotName) {
    if (!honeypotName) {
        alert("Honeypot name is missing.");
        return;
    }

    // Encode the honeypot name to ensure special characters are handled properly
    const encodedHoneypotName = encodeURIComponent(honeypotName);

    // Construct the URL and redirect
    const url = `hpDetails.html?honeypotName=${encodedHoneypotName}`;
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

// Optional: Refresh data periodically
setInterval(fetchAndDisplayHoneypotData, 30000); // Refresh every 30 seconds
