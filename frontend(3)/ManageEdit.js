// Script to dynamically update the honeypot name, error count, and threat level
document.addEventListener("DOMContentLoaded", function () {
    // Set honeypot name
    const honeypotName = "My Honeypot"; // Replace with actual honeypot name
    document.querySelector(".navbar h1").textContent = honeypotName;

    // Set error count and threat level
    const errorCount = 5; // Replace with the actual error count
    const threatLevel = "Medium"; // Replace with "Low", "Medium", or "High"

    document.getElementById("error-count").textContent = errorCount;
    document.getElementById("threat-level").textContent = threatLevel;

    // Optional: Add styles for threat level
    const threatSpan = document.getElementById("threat-level");
    if (threatLevel === "High") {
        threatSpan.style.color = "red";
    } else if (threatLevel === "Medium") {
        threatSpan.style.color = "orange";
    } else {
        threatSpan.style.color = "green";
    }
});

function deleteHoneypot() {
    // Simulate a delete operation (e.g., API call)
    const isDeleted = Math.random() > 0.5; // Simulate success or error randomly

    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'block';

    if (isDeleted) {
        messageDiv.textContent = 'Honeypot successfully deleted!';
        messageDiv.style.color = 'green';
    } else {
        messageDiv.textContent = 'Error: Failed to delete the honeypot.';
        messageDiv.style.color = 'red';
    }

    // Optional: Hide the message after a few seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}


// ---------------------------------------------------------------------
// Enable drag-and-drop functionality for dropzones
function enableDragAndDrop(dropzoneId, placeholderText) {
    const dropzone = document.getElementById(dropzoneId);

    dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.style.border = "2px dashed #4CAF50";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.border = "2px dashed #ccc";
    });

    dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropzone.style.border = "2px dashed #ccc";

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const fileList = document.createElement("ul");
            for (const file of files) {
                const li = document.createElement("li");
                li.textContent = file.name;
                fileList.appendChild(li);
            }
            dropzone.appendChild(fileList);
        } else {
            const data = event.dataTransfer.getData("text");
            const item = document.createElement("p");
            item.textContent = data || placeholderText;
            dropzone.appendChild(item);
        }
    });
}

