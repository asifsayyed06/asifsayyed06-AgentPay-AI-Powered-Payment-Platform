// Lightweight JSON-file datastore.
// In production, swap this for Postgres/MongoDB — the interface below
// (getAll, getById, insert, update) is kept deliberately DB-agnostic
// so that swap only touches this file.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'store.json');

function loadStore() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      agents: [],
      transactions: [],
      merchants: [
        { id: 'm_amazon', name: 'Amazon', category: 'ecommerce', trusted: true },
        { id: 'm_swiggy', name: 'Swiggy', category: 'food', trusted: true },
        { id: 'm_unknown1', name: 'QuickCoinExchange', category: 'crypto', trusted: false }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveStore(store) {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

function getAll(collection) {
  const store = loadStore();
  return store[collection] || [];
}

function getById(collection, id) {
  const store = loadStore();
  return (store[collection] || []).find((item) => item.id === id);
}

function insert(collection, item) {
  const store = loadStore();
  if (!store[collection]) store[collection] = [];
  store[collection].push(item);
  saveStore(store);
  return item;
}

function update(collection, id, updates) {
  const store = loadStore();
  const idx = (store[collection] || []).findIndex((item) => item.id === id);
  if (idx === -1) return null;
  store[collection][idx] = { ...store[collection][idx], ...updates };
  saveStore(store);
  return store[collection][idx];
}

module.exports = { getAll, getById, insert, update, loadStore, saveStore };
