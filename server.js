const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const honeypotRoutes = require('./routes/honeypotRoutes');
//const logRoutes = require('./routes/logRoutes'); // Import log routes
//const logRoute=require('./routes/logs')
const LOG_RETENTION_FIlE = 'logretention.txt';
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());


// Routes
app.use('/api', honeypotRoutes);
//app.use('/api', logRoutes);
//app.use('/api/logs', logRoute)

//Endpoint to delete logs based on user input 
app.delete("/delete-logs", async (req, res) => {
    try {
        if (!fs.existsSync(LOG_RETENTION_FILE)) {
            return res.status(400).json({ error: "logretention.txt file not found." });
        }

        const logRetentionData = fs.readFileSync(LOG_RETENTION_FILE, "utf-8");
        const lines = logRetentionData.trim().split("\n");
        const now = new Date();

        for (const line of lines) {
            const [honeypotName, retentionDays] = line.split(":").map(part => part.trim());

            if (!honeypotName || !retentionDays || isNaN(retentionDays)) {
                console.warn(`Invalid line in logretention.txt: ${line}`);
                continue;
            }

            const retentionPeriodMs = parseInt(retentionDays) * 24 * 60 * 60 * 1000;

            // Docker logs location
            const containerLogPath = `/var/lib/docker/containers/${honeypotName}`;
            if (!fs.existsSync(containerLogPath)) {
                console.warn(`Log path for honeypot ${honeypotName} not found.`);
                continue;
            }

            const files = fs.readdirSync(containerLogPath);
            for (const file of files) {
                const filePath = path.join(containerLogPath, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > retentionPeriodMs) {
                    console.log(`Deleting log file: ${filePath}`);
                    fs.unlinkSync(filePath);
                }
            }
        }

        res.json({ message: "Logs cleaned up based on retention policy." });
    } catch (error) {
        console.error("Error deleting logs:", error);
        res.status(500).json({ error: "Failed to clean up logs." });
    }
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
