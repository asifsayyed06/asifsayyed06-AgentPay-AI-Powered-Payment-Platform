// Optional: if a .env file exists and dotenv is installed, load it.
// Not required to run the project — plain environment variables work too.
try { require('dotenv').config(); } catch (e) { /* dotenv not installed, skip */ }

const express = require('express');
const cors = require('cors');

const agentsRouter = require('./routes/agents');
const transactionsRouter = require('./routes/transactions');
const merchantsRouter = require('./routes/merchants');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'agentic-commerce-backend' }));

app.use('/api/agents', agentsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/merchants', merchantsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Agentic commerce backend running on http://localhost:${PORT}`);
});
