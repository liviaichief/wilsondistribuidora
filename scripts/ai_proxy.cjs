const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

app.post('/api/bbq-master', async (req, res) => {
    const { messages, systemPrompt } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            temperature: 0.8
        });
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('OpenAI Proxy running on http://localhost:3000');
});
