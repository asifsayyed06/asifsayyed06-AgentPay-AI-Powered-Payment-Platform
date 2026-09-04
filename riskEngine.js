const db = require('../data/db');

// Rule-based risk scoring for agent-initiated transactions.
// Each rule contributes a weighted score; total score determines the action.
// This is intentionally simple/explainable (not a black-box ML model) so
// every decision can be justified to a user or auditor — important for
// financial systems where "why was this blocked?" needs a real answer.

const THRESHOLDS = {
  REVIEW: 30,   // score >= 30 -> hold for human approval
  BLOCK: 70     // score >= 70 -> auto-decline
};

function evaluateTransaction({ agent, amount, merchantId, recentTransactions }) {
  const reasons = [];
  let score = 0;

  // Rule 1: amount exceeds the agent's configured per-transaction limit
  if (amount > agent.limits.perTransaction) {
    score += 40;
    reasons.push(`Amount ₹${amount} exceeds agent's per-transaction limit of ₹${agent.limits.perTransaction}`);
  }

  // Rule 2: merchant not on the agent's allowed/trusted list
  const merchant = db.getById('merchants', merchantId);
  if (!merchant) {
    score += 25;
    reasons.push('Unknown merchant ID');
  } else if (!merchant.trusted && !agent.allowedMerchants.includes(merchantId)) {
    score += 35;
    reasons.push(`Merchant "${merchant.name}" is untrusted and not on agent's allowlist`);
  }

  // Rule 3: velocity check — too many transactions in a short window
  const now = Date.now();
  const lastHour = recentTransactions.filter(
    (t) => now - new Date(t.createdAt).getTime() < 60 * 60 * 1000
  );
  if (lastHour.length >= agent.limits.maxTransactionsPerHour) {
    score += 30;
    reasons.push(`Agent has made ${lastHour.length} transactions in the last hour (limit: ${agent.limits.maxTransactionsPerHour})`);
  }

  // Rule 4: cumulative daily spend check
  const today = recentTransactions.filter(
    (t) => now - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000 && t.status === 'approved'
  );
  const todaySpend = today.reduce((sum, t) => sum + t.amount, 0);
  if (todaySpend + amount > agent.limits.dailyCap) {
    score += 30;
    reasons.push(`Would exceed daily cap of ₹${agent.limits.dailyCap} (already spent ₹${todaySpend} today)`);
  }

  let decision = 'approved';
  if (score >= THRESHOLDS.BLOCK) decision = 'declined';
  else if (score >= THRESHOLDS.REVIEW) decision = 'pending_review';

  return { score, decision, reasons };
}

module.exports = { evaluateTransaction, THRESHOLDS };
