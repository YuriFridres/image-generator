import express from 'express';
import { handleHotmart } from './hotmart.js';
import { handleTelegramUpdate } from './telegram.js';

const app = express();
app.use(express.json());

app.post('/webhook/hotmart', handleHotmart);
app.post('/webhook/telegram', handleTelegramUpdate);
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot rodando na porta ${PORT}`));
