// Handle hover effect on rows
const rows = document.querySelectorAll('.table-row');
rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#f0f0f0'; // Light gray on hover
    });
    row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = ''; // Reset to original
    });
});

// Redirect honeypot name to ManageEdit.html
const honeypotNames = document.querySelectorAll('.honeypot-name');
honeypotNames.forEach(name => {
    name.addEventListener('click', event => {
        event.preventDefault(); // Prevent default link behavior
        window.location.href = name.href; // Redirect to ManageEdit.html
    });
});

// Open domain links in new tab
const honeypotDomains = document.querySelectorAll('.honeypot-domain');
honeypotDomains.forEach(domain => {
    domain.setAttribute('target', '_blank'); // Ensure links open in a new tab
});

// Functionality for the Refresh Button
const refreshButton = document.getElementById('refresh-button');
refreshButton.addEventListener('click', () => {
    location.reload();
});



// Checkbox Selection Helper
document.querySelectorAll('.honeypot-checkbox').forEach(checkbox => {
    checkbox.addEventListener('click', (event) => {
        const row = checkbox.closest('.table-row');
        if (checkbox.checked) {
            row.style.backgroundColor = '#d1f4d3'; // Green highlight for selection
        } else {
            row.style.backgroundColor = ''; // Reset background if unchecked
        }
    });
});

// Delete Button Functionality
const deleteButton = document.getElementById('delete-button');

deleteButton.addEventListener('click', () => {
    // Get all selected checkboxes
    const checkboxes = document.querySelectorAll('.honeypot-checkbox:checked');
    
    if (checkboxes.length === 0) {
        // No checkboxes selected
        alert('Please select at least one honeypot to delete.');
        return;
    }

    // Gather names of selected honeypots
    const selectedHoneypots = Array.from(checkboxes).map(checkbox => {
        const row = checkbox.closest('.table-row');
        return row.getAttribute('data-name');
    });

    // Show confirmation prompt with selected honeypots
    const confirmDelete = confirm(
        `You have selected the following honeypots:\n\n${selectedHoneypots.join(', ')}\n\nAre you sure you want to delete them?`
    );

    if (!confirmDelete) return;

    // Remove selected rows
    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('.table-row');
        row.remove();
    });

    // Show success message with deleted honeypots
    alert(`The following honeypots have been successfully deleted:\n\n${selectedHoneypots.join(', ')}`);
});

// ----------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const honeypotTable = document.getElementById("honeypot-table");

    // Fetch honeypot data from the backend
    fetch("http://localhost:5000/api/honeypots") // Update the URL to match your API route
        .then(response => response.json())
        .then(honeypots => {
            honeypots.forEach(honeypot => {
                // Create a new row
                const row = document.createElement("div");
                row.classList.add("table-row");
                row.setAttribute("data-name", honeypot.name);

                // Add cells to the row
                row.innerHTML = `
                    <div><input type="checkbox" class="honeypot-checkbox" /></div>
                    <div><a href="ManageEdit.html" class="honeypot-name">${honeypot.name}</a></div>
                    <div><a href="${honeypot.domain}" target="_blank" class="honeypot-domain">${honeypot.domain}</a></div>
                    <div>${honeypot.status}</div>
                    <div>${honeypot.threatLevel}</div>
                `;

                // Append the row to the table
                honeypotTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching honeypot data:", error);
            honeypotTable.innerHTML = "<p>Error loading honeypots.</p>";
        });
});