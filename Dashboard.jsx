import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const STATUS_LABEL = {
  approved: 'Approved',
  pending_review: 'Pending review',
  declined: 'Declined'
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status] || status}</span>;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Dashboard({ session, onSessionUpdate, onSignOut }) {
  const { ownerId, agent, token } = session;

  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [merchantId, setMerchantId] = useState('');
  const [amount, setAmount] = useState(1000);
  const [description, setDescription] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [busyTxnId, setBusyTxnId] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const merchantById = useMemo(() => Object.fromEntries(merchants.map((m) => [m.id, m])), [merchants]);

  const refreshTransactions = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const { transactions } = await api.listTransactions(ownerId);
      setTransactions(transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTxns(false);
    }
  }, [ownerId]);

  useEffect(() => {
    api.listMerchants().then((d) => {
      setMerchants(d.merchants || []);
      if (d.merchants && d.merchants.length && !merchantId) setMerchantId(d.merchants[0].id);
    }).catch((err) => setError(err.message));
    refreshTransactions();
    const interval = setInterval(refreshTransactions, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTransactions]);

  const pending = transactions.filter((t) => t.status === 'pending_review');

  const spentToday = transactions
    .filter((t) => t.status === 'approved' && Date.now() - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000)
    .reduce((sum, t) => sum + t.amount, 0);

  async function simulate(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSimulating(true);
    try {
      const { transaction } = await api.simulateTransaction(token, {
        merchantId,
        amount: Number(amount),
        description: description.trim()
      });
      setNotice(
        transaction.status === 'approved'
          ? `Auto-approved · risk score ${transaction.riskScore}`
          : transaction.status === 'pending_review'
          ? `Held for your review · risk score ${transaction.riskScore}`
          : `Auto-declined · risk score ${transaction.riskScore}`
      );
      await refreshTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  async function resolve(id, action) {
    setBusyTxnId(id);
    setError('');
    try {
      if (action === 'approve') await api.approveTransaction(id);
      else await api.declineTransaction(id);
      await refreshTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyTxnId(null);
    }
  }

  async function revokeAgent() {
    if (!window.confirm(`Revoke "${agent.name}"? It will be unable to transact until re-authorized.`)) return;
    setRevoking(true);
    try {
      const { agent: updated } = await api.revokeAgent(agent.id);
      onSessionUpdate({ ...session, agent: updated });
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  }

  const isRevoked = agent.status !== 'active';

  return (
    <div className="dashboard">
      <header className="dash-topbar">
        <a className="logo" href="#top"><span className="logo-mark">✦</span>agentpay</a>
        <div className="dash-agent-pill">
          <span className={isRevoked ? 'dot dot-red' : 'dot dot-green'} />
          {agent.name}
          <span className="dash-owner">· {ownerId}</span>
        </div>
        <div className="dash-topbar-actions">
          <button className="text-btn" onClick={revokeAgent} disabled={revoking || isRevoked}>
            {isRevoked ? 'Revoked' : revoking ? 'Revoking…' : 'Revoke agent (kill switch)'}
          </button>
          <button className="login" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      {isRevoked && (
        <div className="banner banner-danger">This agent has been revoked and can no longer transact. Authorize a new one to continue testing.</div>
      )}

      <div className="dash-grid">
        <section className="dash-cards">
          <div className="dash-card">
            <small>Per-transaction limit</small>
            <strong>₹{agent.limits.perTransaction.toLocaleString('en-IN')}</strong>
          </div>
          <div className="dash-card">
            <small>Daily cap</small>
            <strong>₹{agent.limits.dailyCap.toLocaleString('en-IN')}</strong>
          </div>
          <div className="dash-card">
            <small>Spent today</small>
            <strong>₹{spentToday.toLocaleString('en-IN')}</strong>
          </div>
          <div className="dash-card">
            <small>Max txns / hour</small>
            <strong>{agent.limits.maxTransactionsPerHour}</strong>
          </div>
        </section>

        <section className="dash-panel">
          <h3>Simulate a purchase</h3>
          <p className="panel-sub">Send a real request through the risk engine as this agent.</p>
          <form onSubmit={simulate} className="simulate-form">
            <label>Merchant
              <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{!m.trusted ? ' (untrusted)' : ''}</option>
                ))}
              </select>
            </label>
            <label>Amount (₹)
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label>Description (optional)
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Order #..." />
            </label>
            <button className="primary-btn full" type="submit" disabled={simulating || isRevoked}>
              {simulating ? 'Sending…' : 'Simulate purchase'} <span>↗</span>
            </button>
          </form>
          {notice && <div className="form-notice">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
        </section>

        <section className="dash-panel dash-pending">
          <h3>Pending your approval {pending.length > 0 && <span className="count-pill">{pending.length}</span>}</h3>
          <p className="panel-sub">Held by the risk engine — nothing moves until you decide.</p>
          {pending.length === 0 && <div className="empty-state">Nothing waiting on you right now.</div>}
          {pending.map((t) => (
            <div className="pending-row" key={t.id}>
              <div className="pending-main">
                <strong>₹{t.amount.toLocaleString('en-IN')} → {merchantById[t.merchantId]?.name || t.merchantId}</strong>
                <small>Risk score {t.riskScore}/100 · {timeAgo(t.createdAt)}</small>
                {t.riskReasons?.length > 0 && (
                  <ul className="reasons">{t.riskReasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                )}
              </div>
              <div className="pending-actions">
                <button className="approve-btn" disabled={busyTxnId === t.id} onClick={() => resolve(t.id, 'approve')}>Approve</button>
                <button className="decline-btn" disabled={busyTxnId === t.id} onClick={() => resolve(t.id, 'decline')}>Decline</button>
              </div>
            </div>
          ))}
        </section>

        <section className="dash-panel dash-ledger">
          <div className="ledger-head">
            <h3>Live ledger</h3>
            <button className="text-btn" onClick={refreshTransactions}>{loadingTxns ? 'Refreshing…' : 'Refresh ↻'}</button>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state">No transactions yet — simulate a purchase to see it work.</div>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr><th>Time</th><th>Merchant</th><th>Amount</th><th>Risk</th><th>Status</th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{timeAgo(t.createdAt)}</td>
                    <td>{merchantById[t.merchantId]?.name || t.merchantId}</td>
                    <td>₹{t.amount.toLocaleString('en-IN')}</td>
                    <td>{t.riskScore}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
