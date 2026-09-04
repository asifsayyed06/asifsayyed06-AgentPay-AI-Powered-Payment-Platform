const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { verifyAgentToken } = require('../middleware/auth');
const { evaluateTransaction } = require('../utils/riskEngine');

const router = express.Router();

// Agent-initiated transaction. This is the core "agentic commerce" endpoint:
// an AI agent (holding a signed token) requests to pay a merchant. The
// request passes through the risk engine before money conceptually moves.
router.post('/', verifyAgentToken, (req, res) => {
  const { merchantId, amount, description } = req.body;
  const agentId = req.agent.agentId;

  if (!merchantId || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'merchantId and a positive numeric amount are required' });
  }

  const agent = db.getById('agents', agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  if (agent.status !== 'active') {
    return res.status(403).json({ error: `Agent is ${agent.status}, cannot transact` });
  }

  const recentTransactions = db.getAll('transactions').filter((t) => t.agentId === agentId);
  const { score, decision, reasons } = evaluateTransaction({
    agent,
    amount,
    merchantId,
    recentTransactions
  });

  const transaction = {
    id: `txn_${uuidv4().slice(0, 10)}`,
    agentId,
    ownerId: agent.ownerId,
    merchantId,
    amount,
    description: description || '',
    riskScore: score,
    riskReasons: reasons,
    status: decision === 'approved' ? 'approved' : decision, // approved | pending_review | declined
    createdAt: new Date().toISOString(),
    resolvedAt: decision === 'pending_review' ? null : new Date().toISOString(),
    resolvedBy: decision === 'approved' ? 'system' : decision === 'declined' ? 'system' : null
  };

  db.insert('transactions', transaction);

  const statusCode = decision === 'declined' ? 402 : decision === 'pending_review' ? 202 : 201;
  res.status(statusCode).json({ transaction });
});

// List transactions (optionally filtered by owner or agent) — powers the dashboard
router.get('/', (req, res) => {
  const { ownerId, agentId, status } = req.query;
  let transactions = db.getAll('transactions');
  if (ownerId) transactions = transactions.filter((t) => t.ownerId === ownerId);
  if (agentId) transactions = transactions.filter((t) => t.agentId === agentId);
  if (status) transactions = transactions.filter((t) => t.status === status);
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ transactions });
});

// Human-in-the-loop: owner approves a transaction that was held for review
router.post('/:id/approve', (req, res) => {
  const txn = db.getById('transactions', req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (txn.status !== 'pending_review') {
    return res.status(400).json({ error: `Transaction is ${txn.status}, not pending review` });
  }
  const updated = db.update('transactions', req.params.id, {
    status: 'approved',
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'owner'
  });
  res.json({ transaction: updated });
});

// Human-in-the-loop: owner declines a transaction held for review
router.post('/:id/decline', (req, res) => {
  const txn = db.getById('transactions', req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (txn.status !== 'pending_review') {
    return res.status(400).json({ error: `Transaction is ${txn.status}, not pending review` });
  }
  const updated = db.update('transactions', req.params.id, {
    status: 'declined',
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'owner'
  });
  res.json({ transaction: updated });
});

module.exports = router;
