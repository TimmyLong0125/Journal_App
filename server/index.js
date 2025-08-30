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

// After app.use(express.json())
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Note: 404 and error handlers must be registered AFTER routes

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
        const entries = await JournalEntry.find().sort({ date: -1 }); // Newest first
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

    try {
        // --- Generate Embedding ---
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const textToEmbed = `${title}\n\n${content}`; // Combine title and content for a richer embedding
        const embeddingResult = await embeddingModel.embedContent(textToEmbed);
        const vector = embeddingResult.embedding.values;
        // --- End Generate Embedding ---

        const newEntry = new JournalEntry({
            title,
            content,
            embedding: vector, // Save the embedding
        });

        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (err) {
        console.error('Error creating journal entry or embedding:', err);
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

// ------------- Gemini Routes -------------
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/journal/:id/summarize', async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const entryDate = entry.date.toLocaleDateString();
    const entryTitle = entry.title;

    const { temperature, maxTokens, format } = req.body || {};
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are an empathetic, evidence-informed psychotherapist.
Task: Summarize the user's journal entry in 3–5 concise sentences.
Constraints: compassionate, non-judgmental, concise, no medical claims.
${format === 'text' ? 'Output as plain text (no markdown).' : 'Output as clean, minimal markdown.'}

Entry Information:
- Date: ${entryDate}
- Title: ${entryTitle}

Entry:
${entry.content}
    `;



    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.3,
        maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 1024,
      },
    });
    const summary = result.response.text();
    res.json({ summary });
  } catch (err) {
    console.error('Gemini summarize error:', err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

// POST /api/journal/:id/reflect - empathic reflection
app.post('/api/journal/:id/reflect', async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const entryDate = entry.date.toLocaleDateString();
    const entryTitle = entry.title;

    const { temperature, maxTokens, format } = req.body || {};
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an empathetic, evidence-informed psychotherapist.
Task: Reflect on the user's journal entry with 3–5 short paragraphs:
1) Validate feelings
2) Identify patterns
3) Suggest one practical next step
Constraints: compassionate, non-judgmental, concise, no medical claims.

${format === 'text' ? 'Output as plain text (no markdown).' : 'Output as clean, minimal markdown.'}

Entry Information:
- Date: ${entryDate}
- Title: ${entryTitle}

Entry:
${entry.content}
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048, // Increased from 320
      },
    });

    // It's possible for the API to return a response with no text if content is blocked.
    if (!result.response || !result.response.text()) {
        const blockReason = result.response.promptFeedback?.blockReason;
        const finishReason = result.response.candidates?.[0]?.finishReason;

        console.error('Gemini reflect error: Empty response from AI.', {
            promptFeedback: result.response.promptFeedback,
            finishReason,
        });

        let message = 'Failed to generate reflection: The AI returned an empty response.';
        if (blockReason) {
            message = `Reflection failed due to a content safety policy (${blockReason}).`;
        } else if (finishReason === 'MAX_TOKENS') {
            message = 'Reflection generation stopped because it reached the maximum length. The token limit has been increased, please try again.';
        } else if (finishReason) {
            message = `Reflection generation stopped unexpectedly (${finishReason}).`;
        }

        return res.status(400).json({ message });
    }

    const reflection = result.response.text();
    res.json({ reflection });
  } catch (err) {
    console.error('Gemini reflect error:', err);
    // Log the full error object to get more details
    console.error('Gemini reflect error details:', JSON.stringify(err, null, 2));
    // Check for specific content safety errors from Gemini
    if (err.message && err.message.includes('SAFETY')) {
        return res.status(400).json({ message: 'Reflection failed due to content safety policy.' });
    }
    res.status(500).json({ message: 'Failed to generate reflection' });
  }
});


// POST /api/journal/:id/analyze - Get structured insights
app.post('/api/journal/:id/analyze', async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    // Define the schema for the structured response
    const schema = {
      type: "object",
      properties: {
        emotions: {
          type: "array",
          items: {
            type: "string",
            enum: ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"]
          }
        },
        sentiment: {
          type: "number",
          description: "A score from -1 (very negative) to 1 (very positive) representing the overall sentiment."
        },
        topics: {
          type: "array",
          description: "An array of 3-5 main topics or themes in the journal entry.",
          items: { type: "string" }
        },
        keyInsights: {
          type: "array",
          description: "A bulleted list of 2-3 key insights or patterns discovered in the text.",
          items: { type: "string" }
        }
      },
      required: ["emotions", "sentiment", "topics", "keyInsights"]
    };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are an top-tier, empathetic, and evidence-informed psychotherapist.
    Please analyze the following patient's journal entry,
    for emotions, sentiment, topics, and key insights.
    Please provide the output in the specified JSON format.\n\nEntry:\n${entry.content}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    const analysisText = result.response.text();
    const analysis = JSON.parse(analysisText);

    // Save the analysis to the database
    entry.emotions = analysis.emotions;
    entry.sentiment = analysis.sentiment;
    entry.topics = analysis.topics;
    entry.keyInsights = analysis.keyInsights;
    const updatedEntry = await entry.save();

    res.json(updatedEntry);

  } catch (err) {
    console.error('Gemini analyze error:', err);
    // Check for specific content safety errors from Gemini
    if (err.message && err.message.includes('SAFETY')) {
        return res.status(400).json({ message: 'Analysis failed due to content safety policy.' });
    }
    res.status(500).json({ message: 'Failed to generate analysis' });
  }
});

// POST /api/journal/search - Search for journal entries
app.post('/api/journal/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // 1. Embed the search query
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const queryEmbeddingResult = await embeddingModel.embedContent(query);
        const queryVector = queryEmbeddingResult.embedding.values;

        // 2. Perform the vector search
        const results = await JournalEntry.aggregate([
            {
                $vectorSearch: {
                    index: "entryEmbeddingIndex", // The name of your Atlas Vector Search index
                    path: "embedding",
                    queryVector: queryVector,
                    numCandidates: 300, // Number of candidates to consider
                    limit: 10, // Number of results to return
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    date: 1,
                    emotions: 1,
                    topics: 1,
                    keyInsights: 1,
                    sentiment: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        res.json({ results });

    } catch (err) {
        console.error('Vector search error:', err);
        res.status(500).json({ message: 'Failed to perform vector search' });
    }
});


// Helpers for Phase 4 RAG
const { randomUUID } = require('crypto');

const conversations = new Map(); // { id, messages: [{role, content}], summary?: string }

function ensureConversation(id) {
  if (id && conversations.has(id)) return conversations.get(id);
  const conv = { id: id || randomUUID(), messages: [], summary: '' };
  conversations.set(conv.id, conv);
  return conv;
}

async function summarizeForContext(text) {
  // 3 bullets, ~100–150 tokens
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const prompt = `
Summarize the following journal entry into 3 concise bullets (100–150 tokens total).
Keep concrete facts/feelings; avoid advice or diagnosis.
Entry:
${text}
`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
  });
  return result.response.text().trim();
}

async function maybeSummarizeConversation(conv) {
  // Summarize when long; keep cost low
  if (conv.messages.length < 8) return;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const transcript = conv.messages.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const prompt = `
Create a compact summary (120–180 tokens) of this therapy chat to preserve context for future turns.
Keep user's goals, recurring themes, and constraints. No advice, no duplicates.

Existing summary (if any):
${conv.summary || '(none)'}

Recent turns:
${transcript}
`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
  });
  conv.summary = result.response.text().trim();
  // Optionally trim message history further to keep memory tiny
  if (conv.messages.length > 12) conv.messages.splice(0, conv.messages.length - 12);
}

// POST /api/therapist/respond
// Body: { question?: string, entryId?: string, conversationId?: string, k?: number }
app.post('/api/therapist/respond', async (req, res) => {
  try {
    const { question, entryId, conversationId, k = 5 } = req.body || {};
    let userQuestion = (question || '').trim();
    let seedEntry = null;

    if (entryId) {
      seedEntry = await JournalEntry.findById(entryId);
      if (!seedEntry) return res.status(404).json({ message: 'Entry not found' });
      if (!userQuestion) {
        userQuestion = `Reflect on this entry and how it relates to my broader patterns. Offer one CBT/ACT technique I can try now.`;
      }
    }
    // Retrieval query text
    const retrievalText = [userQuestion, seedEntry?.content].filter(Boolean).join('\n\n').slice(0, 4000);
    if (!retrievalText) {
      return res.status(400).json({ message: 'Provide a question or entryId' });
    }

    // Conversation
    const conv = ensureConversation(conversationId);

    // 1) Embed query
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const qEmb = await embeddingModel.embedContent(retrievalText);
    const queryVector = qEmb.embedding.values;

    // 2) Vector search top-k
    const results = await JournalEntry.aggregate([
      {
        $vectorSearch: {
          index: "entryEmbeddingIndex",
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit: Math.min(10, Math.max(1, k))
        }
      },
      {
        $project: {
          title: 1, content: 1, date: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    // 3) Summarize retrieved entries into short digests
    const usedEntries = [];
    const digests = [];
    for (const r of results) {
      try {
        const digest = await summarizeForContext(r.content || '');
        digests.push(`- (${usedEntries.length + 1}) ${r.title} — ${digest}`);
        usedEntries.push({ id: String(r._id), title: r.title, date: r.date, score: r.score });
      } catch {
        // Fallback to trimmed content
        digests.push(`- (${usedEntries.length + 1}) ${r.title} — ${String(r.content || '').slice(0, 300)}`);
        usedEntries.push({ id: String(r._id), title: r.title, date: r.date, score: r.score });
      }
      // Mild rate pacing to avoid burst limits (tune/remove as needed)
      await new Promise(r => setTimeout(r, 60));
    }
    const contextDigest = digests.join('\n');

    // 4) Compose final prompt with memory + context
    const recentTurns = conv.messages.slice(-2).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const memorySection = conv.summary ? `Conversation summary:\n${conv.summary}\n\n` : '';
    const seedInfo = seedEntry ? `Current entry:\nTitle: ${seedEntry.title}\n${seedEntry.content}\n\n` : '';

    const systemPrompt = `
Role: Empathetic therapist with strong CBT/ACT skills.
${memorySection}Context entries (from user's past journals, digested):
${contextDigest}

${seedInfo}User question:
${userQuestion}

Respond with:
- Brief validation
- 2 patterns across entries if applicable
- 1 CBT/ACT technique to try this week
- Short reflection question
Constraints: compassionate, non-judgmental, under 300 words. No medical claims. Plain, clear language.
${recentTurns ? `\nRecent turns:\n${recentTurns}` : ''}`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }]}],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
    });

    const assistantText = (result.response && result.response.text()) ? result.response.text().trim() : '';
    if (!assistantText) {
      return res.status(400).json({ message: 'AI returned an empty response' });
    }

    // Update conversation memory
    conv.messages.push({ role: 'user', content: userQuestion });
    conv.messages.push({ role: 'assistant', content: assistantText });
    await maybeSummarizeConversation(conv);

    res.json({
      conversationId: conv.id,
      response: assistantText,
      usedEntries
    });
  } catch (err) {
    console.error('Therapist respond error:', err);
    if (err.message && err.message.includes('SAFETY')) {
      return res.status(400).json({ message: 'Response blocked by content safety.' });
    }
    res.status(500).json({ message: 'Failed to generate therapist response' });
  }
});

// POST /api/ai/ping - Ping the AI
app.post('/api/ai/ping', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent("Reply with a short 'pong' confirmation.");
    const text = result.response.text();
    res.json({ ok: true, text });
  } catch (err) {
    console.error('AI ping error:', err);
    res.status(500).json({ ok: false, message: 'AI ping failed' });
  }
});


// 404 for unknown routes (must be after all other routes)
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Global error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});


// 7. Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
