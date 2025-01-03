const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");

// Initialize Express app
const app = express();


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
