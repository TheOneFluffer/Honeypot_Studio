function refreshTable() {
    alert("Refreshing table!"); // Replace with actual refresh logic
}

function deleteHoneypot(button) {
    // Find the row containing the honeypot to delete
    const row = button.closest('.table-row');
    const honeypotName = row.getAttribute('data-name');

    // Show confirmation prompt
    const confirmDelete = confirm(`Are you sure you want to delete ${honeypotName}?`);
    if (confirmDelete) {
        // Remove the row from the table
        row.remove();

        // Show success message
        alert(`${honeypotName} has been successfully deleted.`);
    }
}