const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    // AI-Generated Fields
    emotions: { type: [String], default: [] },

    sentiment: { type: Number }, // -1 (negative) to 1 (positive)

    topics: { type: [String], default: [] },

    keyInsights: { type: [String], default: [] },
    
    embedding: { type: [Number], default: [] } // For vector embeddings
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
