// URL of the honeypot API endpoint
const apiUrl = "http://localhost:5000";

// Function to show the status modal with a message
function showStatusModal(message, isSuccess = true) {
    const modal = document.getElementById('statusModal');
    const messageElement = document.getElementById('statusMessage');

    messageElement.textContent = message;
    messageElement.style.color = isSuccess ? 'green' : 'red';

    modal.style.display = 'block';
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('statusModal');
    modal.style.display = 'none';
}

// Close modal if the user clicks outside of it
window.onclick = function (event) {
    const modal = document.getElementById('statusModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function submitForm(event) {
    event.preventDefault(); // Prevent default form submission

    // Validate and process the ports field
    const portsInput = document.getElementById('ports').value.trim();
    const portsRegex = /^[0-9]+(,[0-9]+)*$/;

    if (!portsRegex.test(portsInput)) {
        showStatusModal('Invalid ports format. Please enter numbers separated by commas.', false);
        return;
    }

    const portsArray = portsInput.split(',').map(port => parseInt(port.trim(), 10));

    // Collect form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        type: document.getElementById('honeypotType').value,
        ports: portsArray,
        image: document.getElementById('image').value,
        networkInterface: document.getElementById('networkInterface').value,
        lastOctet: parseInt(document.getElementById('lastOctet').value, 10),
        logRetention: parseInt(document.getElementById('logRetention').value, 10),
        honeynet: document.getElementById('honeynet').value.trim(),
        deploymentLocation: document.getElementById('deploymentLocation').value.trim(),
        alert: document.getElementById('alert').value.trim(),
    };

    if (!formData.name || !formData.type || !formData.image || !formData.networkInterface || !formData.honeynet || !formData.deploymentLocation || !formData.alert) {
        showStatusModal('Please fill out all fields.', false);
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/api/honeypots/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const result = await response.json();
            showStatusModal(`Honeypot "${formData.name}" deployed successfully.`);
        } else {
            const error = await response.json();
            showStatusModal(`Failed to deploy honeypot: ${error.message || 'Unknown error'}`, false);
        }
    } catch (err) {
        showStatusModal(`Error: ${err.message || 'Network error occurred'}`, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('honeypotForm').addEventListener('submit', submitForm);
});

function navigateToManageEdit(honeypotName) {
    const url = "ManageEdit.html";
    window.location.href = url;
}