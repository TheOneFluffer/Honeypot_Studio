// const filePath = "http://localhost:5000/api/cveresults"; // Backend API

// fetch(filePath)
//     .then(response => response.text()) // Read as text
//     .then(data => {
//         displayCVEResults(data);
//     })
//     .catch(error => {
//         document.getElementById("cve-results").innerHTML = "<p>Error loading results.</p>";
//         console.error("Error fetching CVE data:", error);
//     });

// function displayCVEResults(data) {
//     const resultsDiv = document.getElementById("cve-results");

//     if (!data.trim()) {
//         resultsDiv.innerHTML = "<p>No CVE results found.</p>";
//         return;
//     }

//     // Split CVE entries by '---' or any consistent delimiter
//     const cveEntries = data.split("---").map(entry => entry.trim()).filter(entry => entry);

//     let htmlContent = "";
//     cveEntries.forEach(cve => {
//         htmlContent += `
//             <div class="cve-entry">
//                 <pre>${cve}</pre>
//                 <hr>
//             </div>
//         `;
//     });

//     resultsDiv.innerHTML = htmlContent;
// }

const filePath = "http://localhost:5000/api/cveresults"; // Backend API

fetch(filePath)
    .then(response => response.text()) // Read as text
    .then(data => {
        displayCVEResults(data);
    })
    .catch(error => {
        document.getElementById("cve-results").value = "Error loading results.";
        console.error("Error fetching CVE data:", error);
    });

function displayCVEResults(data) {
    const resultsTextarea = document.getElementById("cve-results");

    if (!data.trim()) {
        resultsTextarea.value = "No CVE results found.";
        return;
    }

    // Split CVE entries by '---' and format them
    const cveEntries = data.split("---").map(entry => entry.trim()).filter(entry => entry);
    resultsTextarea.value = cveEntries.join("\n\n--------------------\n\n");
}
