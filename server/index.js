// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// 2. Load Environment Variables
dotenv.config();

// 3. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001; // Using 5001 to avoid conflicts with React's 3000

// 4. Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies

// 5. Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Successfully connected to MongoDB Atlas!'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// 6. API Routes (We will define these in the next step)
// --- Journal Routes ---
// GET all journal entries
app.get('/api/journal', (req, res) => {
    res.json({ message: "GET all journal entries route hit" });
});

// POST a new journal entry
app.post('/api/journal', (req, res) => {
    res.json({ message: "POST a new journal entry route hit" });
});

// DELETE a journal entry
app.delete('/api/journal/:id', (req, res) => {
    res.json({ message: `DELETE journal entry with id: ${req.params.id}` });
});


// 7. Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});