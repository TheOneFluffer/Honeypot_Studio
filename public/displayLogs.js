// // URL of the honeypot API endpoint
// const apiUrl = "http://localhost:5000";

// // Helper function to get query parameters from the URL
// function getQueryParam(param) {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(param);
// }

// const honeypotName = getQueryParam("honeypotName");
// if (honeypotName) {
//     // Use the honeypotName to fetch and display logs
//     fetchLogs(honeypotName);
// } else {
//     console.error("Honeypot name is missing in the query parameter.");
// }

// async function fetchLogs(containerId, honeypotName) {
//     try {
//         // Fetch Logs API
//         const response = await fetch(`${apiUrl}/api/logs/${containerId}?honeypot_name=${honeypotName}`, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         });

//         // Fetch VirusTotal API with Payload
//         const VTresponse = await fetch(`${apiUrl}/api/sandbox/${honeypotName}/processExeFiles`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ honeypotName }) // Include honeypot name in request
//         });

//         // Upload logs API
//         const uploadResponse = await fetch(`${apiUrl}/api/honeypots/logs/${honeypotName}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ containerId, logs: "example log data" }) // Adjust as needed
//         });

//         // Process Logs Response
//         if (response.ok) {
//             const data = await response.json();
//             displayLogs(data.logs);
//         } else {
//             console.error("Error fetching logs:", response.statusText);
//             displayLogs(["Failed to fetch logs."]);
//         }

//         // Process VirusTotal Response
//         if (VTresponse.ok) {
//             const VTdata = await VTresponse.json();
//             displayLogsVT(VTdata.results);
//         } else {
//             console.error("Error fetching VirusTotal results:", VTresponse.statusText);
//             displayLogsVT(["Processing VirusTotal request."]);
//         }

//         // Check Upload Response
//         if (!uploadResponse.ok) {
//             console.error("Error uploading logs:", uploadResponse.statusText);
//         }

//     } catch (error) {
//         console.error("Error:", error);
//         displayLogs(["An error occurred while fetching logs."]);
//         displayLogsVT(["An error occurred while fetching VirusTotal results."]);
//     }
// }

// // Fetch and display honeypot data on page load
// async function fetchAndDisplayHoneypotData() {
//     try {
//         const honeypotName = getQueryParam("honeypotName"); // Extract honeypotName from URL
//         const containerId = getQueryParam("containerId"); // Extract containerId from URL

//         if (!honeypotName || !containerId) {
//             console.error("Both honeypotName and containerId are required.");
//             displayLogs(["Missing honeypot name or container ID in the query parameters."]);
//             displayLogsVT(["Missing honeypot name or container ID in the query parameters."]);
//             return;
//         }

//         // Update the honeypot name in the UI
//         const honeypotNameElement = document.getElementById("honeypot-name");
//         honeypotNameElement.textContent = honeypotName;

//         // Call fetchLogs to fetch logs and VirusTotal results
//         await fetchLogs(containerId, honeypotName);
//     } catch (error) {
//         console.error("Error fetching honeypot data:", error);
//         displayLogs(["Unable to fetch honeypot data."]);
//         displayLogsVT(["Unable to fetch honeypot data."]);
//     }
// }

// // Populate the logs in the textarea
// function displayLogs(logs) {
//     const logTextbox = document.getElementById("log-textbox");
//     logTextbox.value = ""; // Clear existing logs

//     if (!logs || logs.length === 0) {
//         logTextbox.value = "No logs available.";
//         return;
//     }

//     // Convert each log to a readable string and populate the textarea
//     logs.forEach(log => {
//         if (typeof log === "object") {
//             logTextbox.value += `${JSON.stringify(log, null, 2)}\n`; // Pretty-print object logs
//         } else {
//             logTextbox.value += `${log}\n`; // Append string logs directly
//         }
//     });
// }

// // Populate the logs in the textarea
// function displayLogsVT(logs) {
//     const vtTextbox = document.getElementById("vt-textbox");
//     vtTextbox.value = ""; // Clear existing logs

//     if (!logs || logs.length === 0) {
//         vtTextbox.value = "No VirusTotal results available.";
//         return;
//     }

//     logs.forEach(log => {
//         vtTextbox.value += typeof log === "object" ? `${JSON.stringify(log, null, 2)}\n` : `${log}\n`;
//     });
// }

// // Initialize on page load
// document.addEventListener("DOMContentLoaded", () => {
//     fetchAndDisplayHoneypotData();
// });

// function navigateToManageEdit() {
//     // Navigate to ManageEdit.html with the honeypot name as a query parameter
//     const url = `ManageEdit.html`;
//     window.location.href = url;
// }

// // Optional: Refresh data periodically
// setInterval(fetchAndDisplayHoneypotData, 10000); // Refresh every 10 seconds


// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Helper function to get query parameters from the URL
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

async function fetchLogs(containerId, honeypotName) {
    try {
        // Fetch Logs API
        const response = await fetch(`${apiUrl}/api/logs/${containerId}?honeypot_name=${honeypotName}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Fetch VirusTotal API with Payload
        const VTresponse = await fetch(`${apiUrl}/api/sandbox/${honeypotName}/processExeFiles`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ honeypotName }) // Include honeypot name in request
        });

        // Upload logs API
        const uploadResponse = await fetch(`${apiUrl}/api/honeypots/logs/${honeypotName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ containerId, logs: "example log data" }) // Adjust as needed
        });

        // Process Logs Response
        if (response.ok) {
            const data = await response.json();
            displayLogs(data.logs);
        } else {
            console.error("Error fetching logs:", response.statusText);
            displayLogs(["Failed to fetch logs."]);
        }

        // Process VirusTotal Response
        if (VTresponse.ok) {
            const VTdata = await VTresponse.json();
            displayLogsVT(VTdata.results);
        } else {
            console.error("Error fetching VirusTotal results:", VTresponse.statusText);
            displayLogsVT(["Processing VirusTotal request."]);
        }

        // Check Upload Response
        if (!uploadResponse.ok) {
            console.error("Error uploading logs:", uploadResponse.statusText);
        }

    } catch (error) {
        console.error("Error:", error);
        displayLogs(["An error occurred while fetching logs."]);
        displayLogsVT(["An error occurred while fetching VirusTotal results."]);
    }
}

// New function to check for .exe files in logs
async function checkExe() {
    try {
        const response = await fetch(`${apiUrl}/api/honeypots/checklogs/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            displayLogsVT(data.results);
        } else {
            console.error("Error checking .exe files:", response.statusText);
            displayLogsVT(["Failed to check .exe files."]);
        }
    } catch (error) {
        console.error("Error:", error);
        displayLogsVT(["An error occurred while checking .exe files."]);
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
            displayLogsVT(["Missing honeypot name or container ID in the query parameters."]);
            return;
        }

        // Update the honeypot name in the UI
        const honeypotNameElement = document.getElementById("honeypot-name");
        honeypotNameElement.textContent = honeypotName;

        // Call fetchLogs to fetch logs and VirusTotal results
        await fetchLogs(containerId, honeypotName);
    } catch (error) {
        console.error("Error fetching honeypot data:", error);
        displayLogs(["Unable to fetch honeypot data."]);
        displayLogsVT(["Unable to fetch honeypot data."]);
    }
}

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

// Populate the logs in the textarea
function displayLogsVT(logs) {
    const vtTextbox = document.getElementById("vt-textbox");
    vtTextbox.value = ""; // Clear existing logs

    if (!logs || logs.length === 0) {
        vtTextbox.value = "No VirusTotal results available.";
        return;
    }

    logs.forEach(log => {
        vtTextbox.value += typeof log === "object" ? `${JSON.stringify(log, null, 2)}\n` : `${log}\n`;
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchAndDisplayHoneypotData();
});

function navigateToManageEdit() {
    // Navigate to ManageEdit.html with the honeypot name as a query parameter
    const url = `ManageEdit.html`;
    window.location.href = url;
}

// Optional: Refresh data periodically
setInterval(fetchAndDisplayHoneypotData, 10000); // Refresh every 10 seconds

async function checkExe() {
    try {
        const response = await fetch(`${apiUrl}/api/honeypots/checklogs/`);
        if (!response.ok) {
            throw new Error("Failed to fetch exe logs");
        }
        const data = await response.json();
        displayExeLogs(data.logs);
    } catch (error) {
        console.error("Error fetching exe logs:", error);
        displayExeLogs(["Error fetching exe logs."]);
    }
}

function displayExeLogs(logs) {
    const exeContainer = document.getElementById("exe-container");
    exeContainer.innerHTML = ""; // Clear previous content

    if (!logs || logs.length === 0) {
        exeContainer.innerHTML = "<p>No suspicious .exe logs found.</p>";
        return;
    }

    // Create link to redirect user
    const link = document.createElement("a");
    link.href = "CVEResults.html";
    link.textContent = "View suspicious .exe logs in CVEResults";
    link.style.fontWeight = "bold";
    link.style.color = "#007bff";
    link.style.textDecoration = "underline";

    exeContainer.appendChild(link);
}

// Modify HTML to include the exe-container below VirusTotal results
document.addEventListener("DOMContentLoaded", () => {
    const vtTextbox = document.getElementById("vt-textbox");
    const exeContainer = document.createElement("div");
    exeContainer.id = "exe-container";
    exeContainer.style.marginTop = "10px";
    exeContainer.style.fontSize = "16px";
    vtTextbox.insertAdjacentElement("afterend", exeContainer);

    checkExe();
});