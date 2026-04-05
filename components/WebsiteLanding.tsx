import React from 'react';
import {
  ArrowRight,
  Blocks,
  Bot,
  Building2,
  CheckCircle2,
  Hotel,
  Landmark,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import './WebsiteLanding.css';

const pillars = [
  {
    title: 'Operations Core',
    description: 'Front desk, housekeeping, arrivals, departures, and shift execution in one operator surface.',
    icon: Hotel,
  },
  {
    title: 'Revenue Integrity',
    description: 'POS-to-PMS posting, night audit readiness, and reconciliation designed to reduce leakage.',
    icon: Wallet,
  },
  {
    title: 'Integration Control',
    description: 'Health checks, retries, token handling, and property onboarding guardrails for stable rollout.',
    icon: ShieldCheck,
  },
  {
    title: 'Human-Safe AI',
    description: 'AI assistance inside explicit role boundaries so teams move faster without losing control.',
    icon: Bot,
  },
];

const audiences = [
  {
    title: 'Independent Hotels',
    description: 'Lower software cost, faster onboarding, and a single command surface for lean teams.',
    points: ['From $3.90 per room', 'Property-level minimums', 'Simple go-live path'],
  },
  {
    title: 'Hotel Groups',
    description: 'Portfolio visibility, rollout governance, and centralized controls across multiple properties.',
    points: ['From $2.90 per room at scale', 'Org-wide standards', 'Multi-property oversight'],
  },
];

const pricing = [
  {
    tier: 'Starter',
    price: '$3.90',
    suffix: '/room/month',
    note: 'Minimum $79 per property',
    details: ['Independent hotels', 'Core PMS and operations', 'Light implementation'],
  },
  {
    tier: 'Pro',
    price: '$5.40',
    suffix: '/room/month',
    note: 'Minimum $149 per property',
    details: ['Advanced operations', 'Stronger controls', 'Best fit for busy hotels'],
    featured: true,
  },
  {
    tier: 'Portfolio',
    price: '$2.90',
    suffix: '/room/month',
    note: 'Minimum $599 per organization',
    details: ['250+ rooms total', 'Multi-property governance', 'Rollout support'],
  },
];

const WebsiteLanding: React.FC = () => {
  return (
    <div className="ws-root">
      <div className="ws-utility-bar">
        <div className="ws-shell ws-utility-inner">
          <span>Hotel Singularity OS</span>
          <span>Human-led hospitality. AI-assisted execution.</span>
        </div>
      </div>

      <header className="ws-header">
        <div className="ws-shell ws-nav">
          <a href="/" className="ws-brand">
            <span className="ws-brand-mark">S</span>
            <span>
              <strong>Singularity</strong>
              <small>Hospitality OS</small>
            </span>
          </a>
          <nav className="ws-links" aria-label="Primary">
            <a href="#solutions">Solutions</a>
            <a href="/hotel-pilot">Pilot</a>
            <a href="/automation-sprints">Automation</a>
            <a href="/bounty-lab">Bounties</a>
            <a href="#pricing">Pricing</a>
            <a href="#buyers">Buyers</a>
            <a href="#trust">Trust</a>
          </nav>
          <div className="ws-nav-actions">
            <a href="/theme-gallery" className="ws-btn ws-btn-ghost">Theme Gallery</a>
            <a href="/app" className="ws-btn">Open App</a>
          </div>
        </div>
      </header>

      <main>
        <section className="ws-hero">
          <div className="ws-shell ws-hero-grid">
            <div>
              <p className="ws-kicker">Hotel platform for both independents and groups</p>
              <h1>Run hotel operations from one command core.</h1>
              <p className="ws-lead">
                Hotel Singularity OS brings operations, revenue control, and human-safe AI into one system with pricing set below typical market software cost.
              </p>
              <div className="ws-hero-actions">
                <a href="/hotel-pilot" className="ws-btn">
                  See 14-Day Pilot
                  <ArrowRight size={16} />
                </a>
                <a href="/app" className="ws-btn ws-btn-ghost">
                  Open Latest App
                </a>
              </div>
              <div className="ws-hero-proof">
                <span><CheckCircle2 size={16} /> Faster front-desk execution</span>
                <span><CheckCircle2 size={16} /> Audit-safe revenue workflows</span>
                <span><CheckCircle2 size={16} /> Portfolio-ready controls</span>
              </div>
            </div>

            <div className="ws-hero-panel">
              <div className="ws-panel-top">
                <span className="ws-panel-chip is-live">Live priority</span>
                <span className="ws-panel-chip">Property command</span>
              </div>
              <div className="ws-priority-list">
                <button className="ws-priority-card is-active">
                  <Building2 size={18} />
                  <div>
                    <strong>Independent hotels</strong>
                    <span>Low monthly cost, fast onboarding, one operating surface.</span>
                  </div>
                </button>
                <button className="ws-priority-card">
                  <Landmark size={18} />
                  <div>
                    <strong>Hotel groups</strong>
                    <span>Multi-property governance, standards, and rollout control.</span>
                  </div>
                </button>
                <button className="ws-priority-card">
                  <Sparkles size={18} />
                  <div>
                    <strong>AI-guided operations</strong>
                    <span>Assistive automation with clear human boundaries.</span>
                  </div>
                </button>
              </div>
              <div className="ws-stat-grid">
                <div>
                  <strong>1 system</strong>
                  <span>Ops + finance + AI</span>
                </div>
                <div>
                  <strong>Below market</strong>
                  <span>Starting at $3.90</span>
                </div>
                <div>
                  <strong>Built for scale</strong>
                  <span>Single property to portfolio</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="ws-section">
          <div className="ws-shell">
            <div className="ws-section-head">
              <p className="ws-kicker">Core value</p>
              <h2>What the platform brings to hotel providers</h2>
            </div>
            <div className="ws-pillars">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article key={pillar.title} className="ws-card">
                    <span className="ws-card-icon"><Icon size={18} /></span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="buyers" className="ws-section ws-section-alt">
          <div className="ws-shell">
            <div className="ws-section-head">
              <p className="ws-kicker">Buying paths</p>
              <h2>Built for both segments without splitting the product</h2>
            </div>
            <div className="ws-audiences">
              {audiences.map((audience) => (
                <article key={audience.title} className="ws-audience-card">
                  <h3>{audience.title}</h3>
                  <p>{audience.description}</p>
                  <ul>
                    {audience.points.map((point) => (
                      <li key={point}><CheckCircle2 size={15} /> {point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="ws-section">
          <div className="ws-shell">
            <div className="ws-section-head">
              <p className="ws-kicker">Pricing direction</p>
              <h2>Positioned below market without looking cheap</h2>
              <p className="ws-section-copy">Annual billing can sit 15% lower, with room-based pricing for independents and portfolio pricing for groups.</p>
            </div>
            <div className="ws-pricing-grid">
              {pricing.map((plan) => (
                <article key={plan.tier} className={`ws-pricing-card${plan.featured ? ' is-featured' : ''}`}>
                  <p className="ws-plan-tier">{plan.tier}</p>
                  <div className="ws-plan-price">
                    <strong>{plan.price}</strong>
                    <span>{plan.suffix}</span>
                  </div>
                  <p className="ws-plan-note">{plan.note}</p>
                  <ul>
                    {plan.details.map((detail) => (
                      <li key={detail}><CheckCircle2 size={15} /> {detail}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="ws-section ws-section-alt">
          <div className="ws-shell ws-trust-grid">
            <div>
              <p className="ws-kicker">Trust</p>
              <h2>Control matters more than feature count in hotel operations</h2>
              <p className="ws-section-copy">
                The platform is positioned around auditability, role boundaries, integration health, and safer AI assistance rather than loose automation promises.
              </p>
            </div>
            <div className="ws-trust-cards">
              <div className="ws-trust-card">
                <ShieldCheck size={18} />
                <div>
                  <strong>Audit-safe workflows</strong>
                  <span>Revenue events, night audit readiness, and controlled handoffs.</span>
                </div>
              </div>
              <div className="ws-trust-card">
                <Blocks size={18} />
                <div>
                  <strong>Operational structure</strong>
                  <span>Clear modules for desk, finance, service, and portfolio control.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ws-cta">
          <div className="ws-shell ws-cta-card">
            <div>
              <p className="ws-kicker">Next step</p>
              <h2>Lead with one of the two revenue lanes, then show the product depth behind them.</h2>
            </div>
            <div className="ws-cta-actions">
              <a href="/hotel-pilot" className="ws-btn">View Pilot Offer</a>
              <a href="/automation-sprints" className="ws-btn ws-btn-ghost">Automation Sprints</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WebsiteLanding;
