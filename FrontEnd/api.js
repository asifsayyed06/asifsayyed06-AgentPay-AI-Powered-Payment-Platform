const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  createAgent: (payload) => request('/agents', { method: 'POST', body: JSON.stringify(payload) }),
  listAgents: (ownerId) => request(`/agents?ownerId=${encodeURIComponent(ownerId)}`),
  revokeAgent: (id) => request(`/agents/${id}/revoke`, { method: 'POST' }),
  listMerchants: () => request('/merchants'),
  listTransactions: (ownerId) => request(`/transactions?ownerId=${encodeURIComponent(ownerId)}`),
  simulateTransaction: (token, payload) =>
    request('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  approveTransaction: (id) => request(`/transactions/${id}/approve`, { method: 'POST' }),
  declineTransaction: (id) => request(`/transactions/${id}/decline`, { method: 'POST' })
};
