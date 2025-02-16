// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Global variable to store fetched honeypot data
let honeypotData = [];

// Extract oldName from URL parameters
function getOldHoneypotName() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('oldName');
}

// Submit the form with oldName and newName
async function submitEditForm(event) {
    event.preventDefault();

    const oldName = getOldHoneypotName();
    if (!oldName) {
        showStatusModal('Old honeypot name not found in URL.', false);
        return;
    }

    const newName = document.getElementById('newname').value;

    // Construct the URL with the query parameters
    const url = `${apiUrl}/api/honeypots/renamehoneypot?oldName=${encodeURIComponent(oldName)}&newName=${encodeURIComponent(newName)}`;

    try {
        const response = await fetch(url, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();

        if (result.status && result.status.toLowerCase() === 'success') {
            showStatusModal(`Renaming failed: ${result.message || 'Unknown error'}`, false);
        } else {
            showStatusModal(result.message || 'Honeypot renamed successfully!', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showStatusModal(`Error: ${error.message}`, false);
    }
}

document.getElementById('honeypotForm').addEventListener('submit', submitEditForm);

// Show status modal with message
function showStatusModal(message, isSuccess = true) {
    const modal = document.getElementById('statusModal');
    const messageElement = document.getElementById('statusMessage');

    messageElement.textContent = message;
    messageElement.style.color = isSuccess ? 'green' : 'red';

    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('statusModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('statusModal');
    if (event.target === modal) {
        closeModal();
    }
};

function navigateTohpDetails() {
    // Navigate to the specified URL format with the old honeypot name as query parameter
    const url = "ManageEdit.html";
    window.location.href = url;
}