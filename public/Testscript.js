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

// Function to populate the table
function populateTable(data) {
    const tableBody = document.querySelector("#honeypot-table tbody");

    // Clear existing table rows
    tableBody.innerHTML = "";

    // Create table rows dynamically
    const row = `
        <tr>
            <td>${data._id}</td>
            <td>${data.name}</td>
            <td>${data.image}</td>
            <td>${data.port}</td>
            <td>${data.status}</td>
            <td>${data.type}</td>
            <td>${new Date(data.createdAt).toLocaleString()}</td>
            <td>${new Date(data.updatedAt).toLocaleString()}</td>
        </tr>
    `;

    // Append the row to the table
    tableBody.innerHTML = row;
}

// Call the function to fetch and display data
fetchAndDisplayHoneypotData();

// Optional: Refresh data periodically
setInterval(fetchAndDisplayHoneypotData, 60000); // Refresh every 60 seconds
