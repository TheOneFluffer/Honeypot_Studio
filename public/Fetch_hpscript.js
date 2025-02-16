// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000/api/honeypots";


// Function to fetch and display data
async function fetchAndDisplayHoneypotData() {
    try {
        // Fetch data from the API
        const response = await fetch(apiUrl);

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Populate the table with the fetched data
        populateTable(data);
    } catch (error) {
        console.error("Error fetching honeypot data:", error);
        alert("Failed to fetch honeypot data. Please check the API and try again.");
    }
}

// Function to populate the table (viewLogs)
function populateTable(data) {
    const tableBody = document.querySelector("#honeypot-table tbody");

    // Clear existing table rows
    tableBody.innerHTML = "";

    // Iterate through the data array and create table rows dynamically [status need to remember to add back start and stop honeypot]
    data.forEach(honeypot => {
        const row = `
            <tr>
                <td>${honeypot._id}</td>
                <td>${honeypot.name}</td>
                <td>${honeypot.image}</td>
                <td>${honeypot.__v}</td>
                <td>${honeypot.alert}</td>
                <td>${honeypot.type}</td>
                <td>${honeypot.ports}</td>
                <td>${honeypot.IP}</td>
                <td>${honeypot.networkInterface}</td>
                <td>${honeypot.honeynet}</td>
                <td>${honeypot.deploymentLocation}</td>
                <td>${honeypot.logRetention}</td>
                <td>${honeypot.status}</td> 
                <td>${new Date(honeypot.createdAt).toLocaleString()}</td>
                <td>${new Date(honeypot.updatedAt).toLocaleString()}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editHoneypot('${honeypot._id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteHoneypot('${honeypot._id}')">Delete</button>
                    <button class="btn btn-warning btn-sm" onclick="ViewLog('${honeypot.name}')">View Log</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Function to start a honeypot
async function startHoneypot(honeypotId) {
    try {
        const startUrl = `${apiUrl}/${honeypotId}/start`; // API endpoint to start a honeypot
        const response = await fetch(startUrl, {
            method: "POST",
        });

        if (!response.ok) {
            throw new Error(`Failed to start honeypot. Status: ${response.status}`);
        }

        alert("Honeypot started successfully!");

        // Refresh the table to reflect the updated status
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error starting honeypot:", error);
        alert("Failed to start the honeypot. Please try again.");
    }
}

// Function to stop a honeypot
async function stopHoneypot(honeypotId) {
    try {
        const stopUrl = `${apiUrl}/${honeypotId}/stop`; // API endpoint to stop a honeypot
        const response = await fetch(stopUrl, {
            method: "POST",
        });

        if (!response.ok) {
            throw new Error(`Failed to stop honeypot. Status: ${response.status}`);
        }

        alert("Honeypot stopped successfully!");

        // Refresh the table to reflect the updated status
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error stopping honeypot:", error);
        alert("Failed to stop the honeypot. Please try again.");
    }
}

// Function to delete honeypot
async function deleteHoneypot(honeypotId) {
    const confirmed = confirm("Are you sure you want to delete this honeypot?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${apiUrl}/${honeypotId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Failed to delete honeypot. Status: ${response.status}`);
        }

        alert("Honeypot deleted successfully!");
        console.log("Honeypot deleted successfully!");

        // Refresh the table after deletion
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error deleting honeypot:", error);
        alert("Failed to delete honeypot. Please try again.");
    }
}

// Function to edit honeypot
async function editHoneypot(honeypotId) {
    try {
        // Fetch the honeypot details
        const response = await fetch(`${apiUrl}/${honeypotId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch honeypot. Status: ${response.status}`);
        }

        const honeypot = await response.json();

        // Populate the edit modal with honeypot details
        document.getElementById("editHoneypotId").value = honeypot._id;
        document.getElementById("editHoneypotName").value = honeypot.name;
        document.getElementById("editHoneypotType").value = honeypot.type;
        document.getElementById("editHoneypotPort").value = honeypot.port;
        document.getElementById("editHoneypotImage").value = honeypot.image;

        // Show the edit modal
        $('#editHoneypotModal').modal('show');
    } catch (error) {
        console.error("Error fetching honeypot for editing:", error);
        alert("Failed to fetch honeypot details. Please try again.");
    }
}

// Function to save edits
async function saveHoneypotEdits() {
    // Collect input values from the edit form
    const honeypotId = document.getElementById("editHoneypotId").value;
    const name = document.getElementById("editHoneypotName").value;
    const type = document.getElementById("editHoneypotType").value;
    const port = document.getElementById("editHoneypotPort").value;
    const image = document.getElementById("editHoneypotImage").value;

    const honeypotData = { name, type, port, image };

    try {
        const response = await fetch(`${apiUrl}/${honeypotId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(honeypotData),
        });

        if (!response.ok) {
            throw new Error(`Failed to update honeypot. Status: ${response.status}`);
        }

        alert("Honeypot updated successfully!");

        // Close the modal
        $('#editHoneypotModal').modal('hide');

        // Refresh the table
        fetchAndDisplayHoneypotData();
    } catch (error) {
        console.error("Error updating honeypot:", error);
        alert("Failed to update honeypot. Please try again.");
    }
}

/// Function to fetch logs for a specific honeypot
async function fetchLogsForHoneypot(honeypotName) {
    const logsApiUrl = `http://localhost:5000/api/honeypots/logs/${honeypotName}`; // Your backend URL for fetching logs

    try {
        // Fetch the logs from the backend
        const response = await fetch(logsApiUrl);

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response data
        const data = await response.json();

        // Handle the logs response
        displayLogs(data.logs, data.warnings); // Display the logs in a dedicated area

    } catch (error) {
        console.error("Error fetching honeypot logs:", error);
        alert("Failed to fetch logs. Please check the backend and try again.");
    }
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

// Update the ViewLog function to call fetchLogsForHoneypot
function ViewLog(honeypotName) {
    // Call fetchLogsForHoneypot when the View Log button is clicked
    fetchLogsForHoneypot(honeypotName);
}

// Call the function to fetch and display data
fetchAndDisplayHoneypotData();

// Optional: Refresh data periodically
setInterval(fetchAndDisplayHoneypotData, 30000); // Refresh every 30 seconds
