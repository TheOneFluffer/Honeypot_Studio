// Not really of an use (Create to log events for specific honeypot) Due to the bug i found recently

const { createLogModel } = require('../models/HoneypotLog'); // Correct path to HoneypotLog

// Function to log events for a specific honeypot
const logEvent = async (honeypotName, eventDetails) => {
    console.log('Logging event for honeypot:', honeypotName);
    console.log('Event Details:',eventDetails);
    try {
        const LogModel = createLogModel(honeypotName); // Dynamically create the model for the specific honeypot

        const log = new LogModel({
            event: eventDetails.event,
            sourceIP: eventDetails.sourceIP,
            details: eventDetails.details,
        });

        // Save the log entry to the respective collection
        await log.save();
        console.log(`Log saved for honeypot ${honeypotName}:`, log);
    } catch (error) {
        console.error(`Error saving log for honeypot ${honeypotName}:`, error);
    }
};

module.exports = { logEvent }; // Export the function
