import React, { useEffect, useState } from 'react';
import { api } from '../api';

// The "Log in / Get started" modal. In a real product this would be a
// full signup flow — here it doubles as the demo's onboarding step:
// the visitor plays the role of the human owner authorizing an AI agent.
function Onboarding({ onClose, onAuthorized }) {
  const [merchants, setMerchants] = useState([]);
  const [ownerId, setOwnerId] = useState('');
  const [agentName, setAgentName] = useState('Shopping Assistant');
  const [perTransaction, setPerTransaction] = useState(2000);
  const [dailyCap, setDailyCap] = useState(5000);
  const [maxTransactionsPerHour, setMaxTransactionsPerHour] = useState(5);
  const [allowedMerchants, setAllowedMerchants] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listMerchants().then((d) => setMerchants(d.merchants || [])).catch(() => {});
  }, []);

  function toggleMerchant(id) {
    setAllowedMerchants((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!ownerId.trim() || !agentName.trim()) {
      setError('Please enter your name/email and an agent name.');
      return;
    }
    setLoading(true);
    try {
      const { agent, token } = await api.createAgent({
        name: agentName.trim(),
        ownerId: ownerId.trim(),
        perTransaction: Number(perTransaction),
        dailyCap: Number(dailyCap),
        maxTransactionsPerHour: Number(maxTransactionsPerHour),
        allowedMerchants
      });
      onAuthorized({ ownerId: ownerId.trim(), agent, token });
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running on :4000?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="demo-modal onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <div className="eyebrow">AUTHORIZE AN AGENT</div>
        <h2>Give your AI agent a wallet.</h2>
        <p>This creates a real agent identity on the backend — a signed token, spending limits and a merchant allowlist — then drops you into the dashboard.</p>

        <form onSubmit={submit} className="onboarding-form">
          <label>Your name or email
            <input value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="you@company.com" required />
          </label>
          <label>Agent name
            <input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Shopping Assistant" required />
          </label>
          <div className="form-row">
            <label>Per-transaction limit (₹)
              <input type="number" min="1" value={perTransaction} onChange={(e) => setPerTransaction(e.target.value)} />
            </label>
            <label>Daily cap (₹)
              <input type="number" min="1" value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} />
            </label>
          </div>
          <label>Max transactions / hour
            <input type="number" min="1" value={maxTransactionsPerHour} onChange={(e) => setMaxTransactionsPerHour(e.target.value)} />
          </label>

          {merchants.length > 0 && (
            <div className="merchant-picker">
              <span className="picker-label">Pre-approve merchants</span>
              <div className="merchant-chips">
                {merchants.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={allowedMerchants.includes(m.id) ? 'chip chip-on' : 'chip'}
                    onClick={() => toggleMerchant(m.id)}
                  >
                    {m.name}{!m.trusted && <small> · untrusted</small>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? 'Authorizing…' : 'Authorize agent'} <span>↗</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
