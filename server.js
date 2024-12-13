const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const honeypotRoutes = require('./routes/honeypotRoutes');
const logRoutes = require('./routes/logRoutes'); // Import log routes
const logRoute=require('./routes/logs')
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
app.use('/api', logRoutes);
app.use('/api/logs', logRoute)

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
