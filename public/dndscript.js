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
    const data = ev.dataTransfer.getData("text");
    const dropZone = ev.target;
    const draggedElement = document.getElementById(data);

    // Append the dragged element into the drop zone
    if (dropZone.id === "div1" || dropZone.classList.contains("draggable-category")) {
        dropZone.appendChild(draggedElement);
    }

    // Configuration sections
    const configSections = {
        cowrie: document.getElementById("cowrieConfig"),
        honeyd: document.getElementById("honeydConfig"),
        dionaea: document.getElementById("dionaeaConfig"),
        honeytrap: document.getElementById("honeytrapConfig")
    };

    // Hide all configurations by default
    Object.values(configSections).forEach(section => section.style.display = "none");

    // Show the relevant configuration if a honeypot type is dropped
    if (configSections[data]) {
        configSections[data].style.display = "block";
    }
}

// Handle drop in the version box
function dropVersion(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);

    if (ev.target.classList.contains("draggable-category") || ev.target.id === "versionBox") {
        ev.target.appendChild(draggedElement);
    }
}


// Reset draggable items to their original containers
function resetDraggables() {
    const categories = {
        interactionLevel: ["high", "low"],
        honeypotType: ["honeytrap", "cowrie", "dionaea", "honeyd"],
        title3: ["word5", "word6"],
    };

    // Reset each category
    for (const [categoryId, itemIds] of Object.entries(categories)) {
        const category = document.getElementById(categoryId);
        itemIds.forEach(itemId => {
            const item = document.getElementById(itemId);
            if (item) {
                category.appendChild(item);
            }
        });
    }

    // Clear the drop box
    document.getElementById("div1").innerHTML = "";

    // Hide configurations
    document.getElementById("versionBox").style.display = "none";
    ["cowrieConfig", "honeydConfig", "dionaeaConfig", "honeytrapConfig"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
}

// Open Modal
function openModal() {
    document.getElementById("myModal").style.display = "block";
    const dropBox = document.getElementById("div1");
    const items = dropBox.getElementsByClassName("draggable");
    const itemList = document.getElementById("droppedItemsList");
    itemList.innerHTML = "";

    // Consolidate items by category
    const categoryMap = {};
    Array.from(items).forEach(item => {
        const categoryTitle = item.dataset.title || "Unknown Title";
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

// Confirm Honeypot
function confirmHoneypot() {
    alert("Honeypot Created!");
    closeModal();
}

// When honeypot Type is in drop-box--------------------------------------

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const dropZone = document.getElementById("div1");
    const draggedElement = document.getElementById(data);

    // Append the dragged element into the drop zone
    dropZone.appendChild(draggedElement);

    // Manage visibility of Dionaea-specific configurations
    const dionaeaDetails = document.getElementById("dionaeaOptions");
    const cowrieDetails = document.getElementById("cowrieOptions");
    const honeytrapDetails = document.getElementById("honeytrapOptions");
    const honeydDetails = document.getElementById("honeydOptions");

    // Show relevant configuration based on the dragged element
    if (data === "dionaea") {
        dionaeaDetails.style.display = "block";
        cowrieDetails.style.display = "none";
        honeytrapDetails.style.display = "none";
        honeydDetails.style.display = "none";
    } else if (data === "cowrie") {
        cowrieDetails.style.display = "block";
        dionaeaDetails.style.display = "none";
        honeytrapDetails.style.display = "none";
        honeydDetails.style.display = "none";
    } else if (data === "honeytrap") {
        honeytrapDetails.style.display = "block";
        cowrieDetails.style.display = "none";
        dionaeaDetails.style.display = "none";
        honeydDetails.style.display = "none";
    } else if (data === "honeyd") {
        honeydDetails.style.display = "block";
        cowrieDetails.style.display = "none";
        dionaeaDetails.style.display = "none";
        honeytrapDetails.style.display = "none";
    } else {
        dionaeaDetails.style.display = "none";
        cowrieDetails.style.display = "none";
        honeytrapDetails.style.display = "none";
        honeydDetails.style.display = "none";
    }
}




