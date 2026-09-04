import React, { useEffect, useState } from 'react';
import './styles.css';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

const products = [
  { icon: '↗', title: 'Agentic Payments', text: 'Let AI agents discover, decide and pay within limits you control.' },
  { icon: '⌁', title: 'Risk Engine', text: 'Score every transaction with real-time rules, velocity checks and merchant trust.' },
  { icon: '▣', title: 'Control Center', text: 'Monitor activity, review exceptions and revoke access from one dashboard.' },
];

const SESSION_KEY = 'agentpay_session';

function App() {
  const [menu, setMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState(null);
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'

  // Restore a session (owner + agent + token) saved from a previous visit.
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        setView('dashboard');
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  function handleAuthorized(newSession) {
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setShowAuth(false);
    setView('dashboard');
  }

  function handleSessionUpdate(updated) {
    setSession(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setView('landing');
  }

  if (view === 'dashboard' && session) {
    return (
      <>
        <Dashboard session={session} onSessionUpdate={handleSessionUpdate} onSignOut={handleSignOut} />
        {showAuth && <Onboarding onClose={() => setShowAuth(false)} onAuthorized={handleAuthorized} />}
      </>
    );
  }

  return (
    <div className="site">
      <header className="navbar">
        <a className="logo" href="#top"><span className="logo-mark">✦</span>agentpay</a>
        <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Toggle menu">☰</button>
        <nav className={menu ? 'nav-links open' : 'nav-links'}>
          <a href="#products">Products <span>⌄</span></a>
          <a href="#developers">Developers</a>
          <a href="#security">Security</a>
          <a href="#company">Company</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="nav-actions">
          {session ? (
            <button className="login" onClick={() => setView('dashboard')}>Go to dashboard</button>
          ) : (
            <button className="login" onClick={() => setShowAuth(true)}>Log in</button>
          )}
          <button className="nav-cta" onClick={() => setShowAuth(true)}>Get started <span>↗</span></button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse" /> BUILT FOR THE AGENTIC ERA</div>
            <h1>Payments built for<br /><span>AI that acts.</span></h1>
            <p>Give your AI agents the power to transact — with intelligent risk controls, secure identity and a human in the loop when it matters.</p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={() => setShowAuth(true)}>Start building <span>↗</span></button>
              <button className="text-btn" onClick={() => document.getElementById('developers').scrollIntoView({ behavior: 'smooth' })}>Explore the platform <span>→</span></button>
            </div>
            <div className="trust-row"><span>Trusted architecture for</span><strong>secure autonomous commerce</strong></div>
          </div>
          <div className="hero-visual">
            <div className="orb orb-one" /><div className="orb orb-two" />
            <div className="payment-card">
              <div className="card-top"><span className="mini-brand">✦ agentpay</span><span className="verified">● Verified</span></div>
              <div className="card-label">AGENT TRANSACTION</div>
              <div className="amount">₹2,450<span>.00</span></div>
              <div className="merchant"><div className="merchant-icon">A</div><div><strong>Acme Marketplace</strong><small>Order #AG-2048</small></div><span className="success">✓</span></div>
              <div className="card-line"><span>Risk score</span><strong className="green">12 / 100</strong></div>
              <div className="card-line"><span>Policy check</span><strong>Approved</strong></div>
              <div className="progress"><i /></div>
              <div className="card-footer">Protected by AgentPay Guard <span>↗</span></div>
            </div>
            <div className="float-chip chip-top"><span>✦</span> AI-native payments</div>
            <div className="float-chip chip-bottom"><span className="green-dot" /> Human approval ready</div>
          </div>
        </section>

        <section className="stats"><div><strong>100%</strong><span>Policy-controlled</span></div><div><strong>24/7</strong><span>Automated monitoring</span></div><div><strong>1 API</strong><span>For every agent</span></div><div><strong>0 blind spots</strong><span>Complete ledger visibility</span></div></section>

        <section className="section" id="products">
          <div className="section-heading"><div><div className="eyebrow">ONE PLATFORM. TOTAL CONTROL.</div><h2>Everything your agents<br />need to <span>move money.</span></h2></div><p>From first authorization to final settlement, AgentPay makes autonomous commerce safe, observable and easy to scale.</p></div>
          <div className="product-grid">{products.map((p) => <article className="product-card" key={p.title}><div className="product-icon">{p.icon}</div><h3>{p.title}</h3><p>{p.text}</p><a href="#demo" onClick={(e) => { e.preventDefault(); setShowAuth(true); }}>Learn more <span>↗</span></a></article>)}</div>
        </section>

        <section className="dark-band" id="security"><div className="band-copy"><div className="eyebrow light">SECURITY BY DESIGN</div><h2>Autonomy without<br /><span>giving up control.</span></h2><p>Every agent gets a signed identity, strict spending limits and a clear decision trail. Risky payments pause for your approval.</p><button className="white-btn" onClick={() => setShowAuth(true)}>See how it works <span>↗</span></button></div><div className="security-panel"><div className="panel-header"><span>LIVE RISK MONITOR</span><span className="live"><i /> LIVE</span></div><div className="risk-score"><div><small>Current risk score</small><strong>12</strong><span>/100</span></div><div className="ring">LOW<br /><b>RISK</b></div></div><div className="check"><span>✓</span><div><strong>Merchant allowlist</strong><small>Verified merchant</small></div><b>Passed</b></div><div className="check"><span>✓</span><div><strong>Spending limit</strong><small>₹2,450 of ₹10,000 daily</small></div><b>Passed</b></div><div className="check"><span>✓</span><div><strong>Velocity check</strong><small>2 transactions this hour</small></div><b>Passed</b></div></div></section>

        <section className="developer-section" id="developers"><div className="eyebrow">FOR DEVELOPERS</div><h2>Simple to integrate.<br /><span>Powerful by default.</span></h2><p>One clean API for agent identity, payment authorization, risk decisions and real-time events.</p><div className="code-window"><div className="window-top"><span>agentpay.js</span><span>● ● ●</span></div><pre><code>{`const payment = await agentpay.pay({\n  agent: "shopping-assistant",\n  merchant: "acme-marketplace",\n  amount: 2450,\n  currency: "INR"\n});\n\n// → approved: true\n// → riskScore: 12`}</code></pre></div></section>

        <section className="final-cta" id="demo"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>Build the future of<br /><span>autonomous commerce.</span></h2><p>Start with a secure payment foundation for your next AI product.</p></div><button className="primary-btn" onClick={() => setShowAuth(true)}>Create your account <span>↗</span></button></section>
      </main>
      <footer id="company"><div className="logo"><span className="logo-mark">✦</span>agentpay</div><span>Secure payments for intelligent agents.</span><span>© 2026 AgentPay Technologies</span></footer>
      {showAuth && <Onboarding onClose={() => setShowAuth(false)} onAuthorized={handleAuthorized} />}
    </div>
  );
}
export default App;
