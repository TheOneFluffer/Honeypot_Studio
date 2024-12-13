// Allow the drop to happen
function allowDrop(ev) {
    ev.preventDefault();
}

// Drag the item and store its ID
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

// Drop the item into the target div
function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");  // Get the ID of the draggable item
    var draggedElement = document.getElementById(data);  // Find the dragged element
    if (ev.target.classList.contains('draggable-category') || ev.target.id === 'div1') {
        ev.target.appendChild(draggedElement);  // Append the dragged element to the target
    }
    
    // Check if the dropped item is a honeypot type (update version box visibility)
    if (draggedElement.getAttribute("data-title") === "Honeypot Type") {
        showVersionBox(draggedElement.id); // Show the version box
    }
    
}

// Handle drop in the version box
function dropVersion(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");  // Get the ID of the draggable item (version)
    var draggedElement = document.getElementById(data);  // Find the dragged version element
    if (ev.target.classList.contains('draggable-category') || ev.target.id === 'versionBox') {
        ev.target.appendChild(draggedElement);  // Append the dragged element to the version box
    }
}

// show version box when a honeypot type is dropped
function showVersionBox(honeypotId) {
    // Update the label in the version box
    const versionLabel = document.getElementById("versionLabel");
    versionLabel.textContent = `${honeypotId} Version:`;

    // Show the version box in the right column
    document.getElementById("versionBox").style.display = "block";
}


// Reset function to return all draggable items to their original containers
function resetDraggables() {
    // Reset draggable items back to their original categories
    var high = document.getElementById("high");
    var low = document.getElementById("low");

    var honeytrap = document.getElementById("honeytrap");
    var cowrie = document.getElementById("cowrie");
    var dionaea = document.getElementById("dionaea");
    var honeyd = document.getElementById("honeyd");

    var word5 = document.getElementById("word5");
    var word6 = document.getElementById("word6");
    var word7 = document.getElementById("word7");
    var word8 = document.getElementById("word8");
    var word9 = document.getElementById("word9");
    var word10 = document.getElementById("word10");

    // Move all draggable words back to their respective title categories
    document.getElementById("interactionLevel").appendChild(high);
    document.getElementById("interactionLevel").appendChild(low);

    document.getElementById("honeypotType").appendChild(honeytrap);
    document.getElementById("honeypotType").appendChild(cowrie);
    document.getElementById("honeypotType").appendChild(dionaea);
    document.getElementById("honeypotType").appendChild(honeyd);

    document.getElementById("title3").appendChild(word5);
    document.getElementById("title3").appendChild(word6);

    document.getElementById("title4").appendChild(word7);
    document.getElementById("title4").appendChild(word8);

    document.getElementById("title5").appendChild(word9);
    document.getElementById("title5").appendChild(word10);

    // Clear the drop box
    document.getElementById("div1").innerHTML = ''; // Remove all child elements (dropped items)

    // Disable the create button again
    document.getElementById("create-button").disabled = true;

}



// Open Modal
function openModal() {
    document.getElementById("myModal").style.display = "block";

    // Get all items in the dropbox
    const dropBox = document.getElementById("div1");
    const items = dropBox.getElementsByClassName("draggable");

    // Clear the existing list
    const itemList = document.getElementById("droppedItemsList");
    itemList.innerHTML = "";

    // Consolidate items by category
    const categoryMap = {};

    Array.from(items).forEach(item => {
        // Retrieve the category title from the item's data attribute
        const categoryTitle = item.dataset.title || "Unknown Title";

        // Add the item to its category in the map
        if (!categoryMap[categoryTitle]) {
            categoryMap[categoryTitle] = [];
        }
        categoryMap[categoryTitle].push(item.textContent);
    });

    // Populate the list in the modal
    for (const [category, itemListArray] of Object.entries(categoryMap)) {
        const listItem = document.createElement("li");
        listItem.textContent = `${category}: ${itemListArray.join(", ")}`;
        itemList.appendChild(listItem);
    }
}

// Close Modal
function closeModal() {
    document.getElementById("myModal").style.display = "none";
}

// Confirm Honeypot (Placeholder Function)
function confirmHoneypot() {
    alert("Honeypot Created!");
    closeModal();
}

