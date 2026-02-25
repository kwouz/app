import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { getDb } from './db.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_PATH = path.join(__dirname, '.env');
const mask = (k) => (k ? `${k.slice(0, 7)}...${k.slice(-4)}` : "MISSING");

const before = process.env.OPENAI_API_KEY || "";
dotenv.config({ path: ENV_PATH, override: true });
const after = process.env.OPENAI_API_KEY || "";

console.log("CWD:", process.cwd());
console.log("ENV_PATH:", ENV_PATH);
console.log("OPENAI_API_KEY before dotenv:", mask(before));
console.log("OPENAI_API_KEY after dotenv:", mask(after));

// ── Strict API key validation at startup ──
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey === 'your_key_here') {
    console.error('\n❌  OPENAI_API_KEY is missing or still set to placeholder.');
    console.error('   → Edit server/.env and paste your real key.');
    console.error('   → Then restart: node index.js\n');
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, keyLoaded: true });
});

// Debug env endpoint
app.get('/api/debug-env', (_req, res) => {
    const k = process.env.OPENAI_API_KEY || "";
    res.json({
        cwd: process.cwd(),
        envPath: ENV_PATH,
        keyMasked: k ? `${k.slice(0, 7)}...${k.slice(-4)}` : null
    });
});

// ── System prompt (loaded from file) ──
const PROMPT_PATH = path.join(__dirname, 'prompts', 'reflective_ru.txt');
let SYSTEM_PROMPT;
try {
    SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, 'utf-8').trim();
    console.log('Loaded system prompt from', PROMPT_PATH, `(${SYSTEM_PROMPT.length} chars)`);
} catch (err) {
    console.warn('⚠ Could not load prompt file, using fallback:', err.message);
    SYSTEM_PROMPT = 'You are an emotional reflective assistant. Respond in Russian. Be concise (3-5 lines). End with one question.';
}

// ── Max output lines (safety net) ──
const MAX_OUTPUT_LINES = 5;
const MAX_OUTPUT_TOKENS = 150;  // adjust this to allow longer/shorter replies

function trimToMaxLines(text, max = MAX_OUTPUT_LINES) {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    return lines.slice(0, max).join('\n');
}

// GET history
app.get('/api/chat/:chat_id', async (req, res) => {
    try {
        const db = await getDb();
        const { chat_id } = req.params;
        const messages = await db.all(
            'SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC',
            [chat_id]
        );
        res.json({ messages });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST chat
app.post('/api/chat', async (req, res) => {
    try {
        const { chat_id, user_message, context } = req.body;
        if (!chat_id || !user_message) {
            return res.status(400).json({ error: 'chat_id and user_message are required' });
        }

        const db = await getDb();

        // Save user message
        await db.run(
            'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
            [chat_id, 'user', user_message]
        );

        // Load history for OpenAI
        const history = await db.all(
            'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id ASC',
            [chat_id]
        );

        // Build system messages — inject Quick Help context if present
        const systemMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
        if (context && context.stateKey) {
            const ctxNote = `[Контекст] Пользователь выбрал состояние: ${context.stateLabelRu || context.stateKey}.` +
                (context.lastActionTitle ? ` Последнее упражнение: «${context.lastActionTitle}».` : '');
            systemMessages.push({ role: 'system', content: ctxNote });
        }

        const openAiMessages = [
            ...systemMessages,
            ...history.map(m => ({ role: m.role, content: m.content }))
        ];

        // Call OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            temperature: 0.6,
            max_tokens: MAX_OUTPUT_TOKENS,
            messages: openAiMessages
        });

        // Post-process: trim to max lines
        const raw_response = response.choices[0].message.content;
        const assistant_response = trimToMaxLines(raw_response);

        // Save assistant response
        await db.run(
            'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
            [chat_id, 'assistant', assistant_response]
        );

        res.json({ text: assistant_response });

    } catch (e) {
        console.error('CHAT ERROR:', e);
        res.status(500).json({ error: e.message || 'Server error' });
    }
});

// GET /api/practices
app.post('/api/practices', async (req, res) => {
    try {
        const { mood } = req.body;
        if (!mood) return res.status(400).json({ error: 'mood required' });

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 300,
            messages: [
                {
                    role: 'system',
                    content: `You are an empathetic psychology assistant. 
The user currently feels: "${mood}".
Suggest 3 very short, practical micro-practices (each 1-2 sentences) to help them right now given their mood. 
Format as a simple JSON array of strings. Do not use markdown blocks, just return the raw JSON array of strings.`
                }
            ]
        });

        const content = response.choices[0].message.content.trim();
        // Parse the JSON array
        let practices = [];
        try {
            practices = JSON.parse(content);
        } catch (err) {
            // fallback if it didn't return perfect JSON
            practices = content.split('\n').filter(l => l.trim().length > 0).map(l => l.replace(/^[-*0-9.]+\s*/, ''));
        }

        res.json({ practices: practices.slice(0, 3) });
    } catch (e) {
        console.error('PRACTICES ERROR:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/weekly-insights
app.post('/api/weekly-insights', async (req, res) => {
    try {
        const { entries } = req.body; // array of recent entries
        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ error: 'entries array required' });
        }

        const summaryData = entries.map(e => `${e.date} ${e.time}: ${e.mood} ${e.note ? `(${e.note})` : ''}`).join('\n');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            messages: [
                {
                    role: 'system',
                    content: `You are an insightful emotional analyst.
Review the following user mood log for the past 7 days.
Provide a compassionate, 2-3 sentence insight summarizing their week and offering a gentle encouraging thought.
Respond in Russian.

LOG:
${summaryData}`
                }
            ]
        });

        res.json({ insight: response.choices[0].message.content.trim() });
    } catch (e) {
        console.error('INSIGHTS ERROR:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/patterns
app.post('/api/patterns', async (req, res) => {
    try {
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ error: 'entries array required' });
        }

        const summaryData = entries.map(e => `${e.date} ${e.time}: ${e.mood} ${e.note ? `(${e.note})` : ''}`).join('\n');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 300,
            messages: [
                {
                    role: 'system',
                    content: `You are an analytical psychologist. 
Analyze the following user mood history and identify 2-3 key patterns or correlations (e.g., times of day when anxiety spikes, mood drops after specific notes).
Keep each pattern very brief (1 sentence). 
Format the response as a simple JSON array of strings in Russian. Do not include markdown blocks, just raw JSON array.

LOG:
${summaryData}`
                }
            ]
        });

        const content = response.choices[0].message.content.trim();
        let patterns = [];
        try {
            patterns = JSON.parse(content);
        } catch (err) {
            patterns = content.split('\n').filter(l => l.trim().length > 0).map(l => l.replace(/^[-*0-9.]+\s*/, ''));
        }

        res.json({ patterns: patterns.slice(0, 3) });
    } catch (e) {
        console.error('PATTERNS ERROR:', e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
