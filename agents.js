const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { signAgentToken } = require('../middleware/auth');

const router = express.Router();

// Create a new AI agent identity with spending limits and permissions.
// This simulates a user "authorizing" an agent (e.g. a shopping assistant)
// to transact on their behalf within defined boundaries.
router.post('/', (req, res) => {
  const { name, ownerId, dailyCap, perTransaction, maxTransactionsPerHour, allowedMerchants } = req.body;

  if (!name || !ownerId) {
    return res.status(400).json({ error: 'name and ownerId are required' });
  }

  const agent = {
    id: `agent_${uuidv4().slice(0, 8)}`,
    name,
    ownerId,
    scopes: ['transact'],
    status: 'active',
    limits: {
      dailyCap: dailyCap ?? 5000,
      perTransaction: perTransaction ?? 2000,
      maxTransactionsPerHour: maxTransactionsPerHour ?? 5
    },
    allowedMerchants: allowedMerchants ?? [],
    createdAt: new Date().toISOString()
  };

  db.insert('agents', agent);
  const token = signAgentToken(agent);

  res.status(201).json({ agent, token });
});

// List all agents for an owner
router.get('/', (req, res) => {
  const { ownerId } = req.query;
  let agents = db.getAll('agents');
  if (ownerId) agents = agents.filter((a) => a.ownerId === ownerId);
  res.json({ agents });
});

// Get a single agent
router.get('/:id', (req, res) => {
  const agent = db.getById('agents', req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent });
});

// Update agent limits/permissions (human owner adjusting agent's leash)
router.patch('/:id', (req, res) => {
  const { dailyCap, perTransaction, maxTransactionsPerHour, allowedMerchants, status } = req.body;
  const agent = db.getById('agents', req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const updates = {};
  if (status) updates.status = status;
  if (allowedMerchants) updates.allowedMerchants = allowedMerchants;
  updates.limits = {
    dailyCap: dailyCap ?? agent.limits.dailyCap,
    perTransaction: perTransaction ?? agent.limits.perTransaction,
    maxTransactionsPerHour: maxTransactionsPerHour ?? agent.limits.maxTransactionsPerHour
  };

  const updated = db.update('agents', req.params.id, updates);
  res.json({ agent: updated });
});

// Revoke an agent immediately (kill switch)
router.post('/:id/revoke', (req, res) => {
  const updated = db.update('agents', req.params.id, { status: 'revoked' });
  if (!updated) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent: updated });
});

module.exports = router;
