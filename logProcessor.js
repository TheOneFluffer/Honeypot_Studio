/*const puppeteer = require('puppeteer');
const fs = require('fs');

// Define the protocols and keywords you want to search for
const protocols = ['SSH', 'HTTP', 'FTP', 'SMTP', 'Telnet']; //Need to change to make it dynamic
const keywords = ['malware', 'attack', 'exploit']; //Need to change to make it dynamic

// Function to check for protocols in the log entry
const extractProtocols = (logEntry) => {
    return protocols.filter(protocol => new RegExp(protocol, 'i').test(logEntry.log));
};

// Function to check for keywords in the log entry
const extractKeywords = (logEntry) => {
    return keywords.filter(keyword => new RegExp(keyword, 'i').test(logEntry.log));
};

// Function to process logs and return unique protocols and keywords
const processLogs = async (shouldLog = true) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Read the log file
    const logData = fs.readFileSync('severity_cowrie-honeypot.txt', 'utf-8'); //Need to change this to make it dynamic

    const logEntries = JSON.parse(logData);

    const allProtocols = new Set(); // To store unique protocols
    const allKeywords = new Set();   // To store unique keywords

    // Iterate through each log entry
    logEntries.forEach(entry => {
        if (entry.severity && entry.severity.toLowerCase() === 'critical') {
            // Extracting protocols
            const foundProtocols = extractProtocols(entry);
            foundProtocols.forEach(protocol => allProtocols.add(protocol)); // Add to unique set

            // Extracting keywords
            const foundKeywords = extractKeywords(entry);
            foundKeywords.forEach(keyword => allKeywords.add(keyword)); // Add to unique set

            // Print log entry if shouldLog is true
            if (shouldLog) {
                console.log(entry.log); // Print the log entry
            }
        }
    });

    await browser.close(); // Close the browser

    // Convert sets to arrays for display
    return {
        uniqueProtocols: Array.from(allProtocols),
        uniqueKeywords: Array.from(allKeywords),
    };
};

// Export the processLogs function
module.exports = processLogs;*/

/*const puppeteer = require('puppeteer');
const fs = require('fs');

// Read protocols, keywords, and honeypot file name dynamically
const protocols = fs.readFileSync('protocols.txt', 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
const keywords = fs.readFileSync('keywords.txt', 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
const honeypotName = fs.readFileSync('honeypots.txt', 'utf-8').trim();
const logFileName = `severity_${honeypotName}.txt`;

// Function to check for protocols in the log entry
const extractProtocols = (logEntry) => {
    return protocols.filter(protocol => new RegExp(protocol, 'i').test(logEntry.log));
};

// Function to check for keywords in the log entry
const extractKeywords = (logEntry) => {
    return keywords.filter(keyword => new RegExp(keyword, 'i').test(logEntry.log));
};

// Function to process logs and return unique protocols and keywords
const processLogs = async (shouldLog = true) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Read the log file
    const logData = fs.readFileSync(logFileName, 'utf-8');
    const logEntries = JSON.parse(logData);

    const allProtocols = new Set();
    const allKeywords = new Set();

    logEntries.forEach(entry => {
        if (entry.severity && entry.severity.toLowerCase() === 'critical') {
            extractProtocols(entry).forEach(protocol => allProtocols.add(protocol));
            extractKeywords(entry).forEach(keyword => allKeywords.add(keyword));
            if (shouldLog) console.log(entry.log);
        }
    });

    await browser.close();
    return { uniqueProtocols: Array.from(allProtocols), uniqueKeywords: Array.from(allKeywords) };
};

module.exports = processLogs;*/
const puppeteer = require('puppeteer');
const fs = require('fs');

// Read protocols, keywords, honeypot file name, and severity level dynamically
const protocols = fs.readFileSync('protocols.txt', 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
const keywords = fs.readFileSync('keywords.txt', 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
const honeypotName = fs.readFileSync('honeypots.txt', 'utf-8').trim();
const severityLevel = fs.readFileSync('severity.txt', 'utf-8').trim().toLowerCase(); // Read severity level
const logFileName = `severity_${honeypotName}.txt`;

// Function to check for protocols in the log entry
const extractProtocols = (logEntry) => {
    return protocols.filter(protocol => new RegExp(protocol, 'i').test(logEntry.log));
};

// Function to check for keywords in the log entry
const extractKeywords = (logEntry) => {
    return keywords.filter(keyword => new RegExp(keyword, 'i').test(logEntry.log));
};

// Function to process logs and return unique protocols and keywords
const processLogs = async (shouldLog = true) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Read the log file
    const logData = fs.readFileSync(logFileName, 'utf-8');
    const logEntries = JSON.parse(logData);

    const allProtocols = new Set();
    const allKeywords = new Set();

    logEntries.forEach(entry => {
        // Compare with user-specified severity level
        if (entry.severity && entry.severity.toLowerCase() === severityLevel) {
            extractProtocols(entry).forEach(protocol => allProtocols.add(protocol));
            extractKeywords(entry).forEach(keyword => allKeywords.add(keyword));
            if (shouldLog) console.log(entry.log);
        }
    });

    await browser.close();
    return { uniqueProtocols: Array.from(allProtocols), uniqueKeywords: Array.from(allKeywords) };
};
module.exports = processLogs;
