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

// Import the model
const JournalEntry = require('./models/JournalEntry');

// 6. API Routes
// --- Journal Routes ---

// GET /api/journal - Get all journal entries
app.get('/api/journal', async (req, res) => {
    try {
        const entries = await JournalEntry.find().sort({ createdAt: -1 }); // Get newest first
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching journal entries', error: err });
    }
});

// POST /api/journal - Create a new journal entry
app.post('/api/journal', async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    const newEntry = new JournalEntry({
        title,
        content,
    });

    try {
        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (err) {
        res.status(500).json({ message: 'Error saving journal entry', error: err });
    }
});

// DELETE /api/journal/:id - Delete a journal entry
app.delete('/api/journal/:id', async (req, res) => {
    try {
        const entry = await JournalEntry.findByIdAndDelete(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }
        res.json({ message: 'Journal entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting journal entry', error: err });
    }
});


// 7. Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});