// 1. Import Express
const express = require('express');

// 2. Initialize the Express application
const app = express();

// 3. Define the port the server will run on
// Use an environment variable for the port if it exists, otherwise default to 5000
const PORT = process.env.PORT || 5000;

// 4. Create your first API route (the "health check")
// This responds to GET requests at the URL: /api/health
app.get('/api/health', (req, res) => {
  // req: The request object (data from the client)
  // res: The response object (what you send back to the client)
  res.json({ message: 'Server is healthy and running!' });
});

// 5. Start the server and have it listen on the specified port
// It also logs a message to the console to confirm it's running.
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});