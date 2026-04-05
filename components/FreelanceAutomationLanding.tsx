import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarSync,
  Check,
  CheckCircle2,
  CircuitBoard,
  Copy,
  Gauge,
  Mail,
  MessagesSquare,
  Network,
  PhoneCall,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import './FreelanceAutomationLanding.css';

type OfferCard = {
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

type ProofCard = {
  title: string;
  description: string;
  file: string;
  icon: LucideIcon;
};

type PackageCard = {
  title: string;
  price: string;
  note: string;
  details: string[];
  featured?: boolean;
};

type ProjectType = 'voice_sms' | 'multi_agent' | 'crm_scheduling' | 'workflow_automation';
type DeliveryShape = 'prototype' | 'implementation' | 'retainer';
type IntegrationType = 'twilio_openai' | 'n8n_stack' | 'crm_calendar' | 'email_slack';

const heroPoints = [
  'Voice and chat agents with real workflow handoff',
  'CRM, scheduling, and operator-side automation',
  'Fixed-scope builds that can turn into retainers',
];

const offers: OfferCard[] = [
  {
    title: 'Voice and SMS agents',
    description: 'Inbound call handling, voicemail fallback, SMS qualification, and clean handoff to a human or CRM.',
    points: ['Twilio and OpenAI flows', 'Lead capture and appointment logic', 'Lower-cost decision paths'],
    icon: PhoneCall,
  },
  {
    title: 'Workflow automation systems',
    description: 'Production-minded orchestration across email, sheets, CRMs, Slack, and custom APIs.',
    points: ['n8n or API-driven automations', 'Retries, failure paths, and ownership rules', 'Maintainable handoff after launch'],
    icon: Workflow,
  },
  {
    title: 'Multi-agent builds',
    description: 'Agent systems with explicit roles, shared memory boundaries, and business-specific routing logic.',
    points: ['More than one agent role', 'Observable orchestration paths', 'Business rules around AI behavior'],
    icon: Network,
  },
  {
    title: 'Internal ops tools',
    description: 'Operator surfaces and management workflows for teams that need more than a demo bot.',
    points: ['Front-end delivery included', 'Payments and workflow states', 'Built for real operators'],
    icon: BriefcaseBusiness,
  },
];

const proofCards: ProofCard[] = [
  {
    title: 'Multi-agent orchestration is already live',
    description: 'The repo already includes specialized agent roles and operating boundaries instead of a single generic chat flow.',
    file: 'services/intelligence/agentService.ts',
    icon: Bot,
  },
  {
    title: 'Workflow routing is already real',
    description: 'Requests already move into business logic and operational handoff, which is exactly what freelance buyers want.',
    file: 'services/operations/guestActionService.ts',
    icon: Workflow,
  },
  {
    title: 'Payments are already part of the system',
    description: 'This is helpful proof for buyers who need paid flows, monetized automations, or transactional behavior.',
    file: 'services/payments/paymentService.ts',
    icon: Gauge,
  },
  {
    title: 'Business-grade UI already exists',
    description: 'The app already ships real operator surfaces, which helps position beyond backend-only automation work.',
    file: 'components/OpsApp.tsx',
    icon: CircuitBoard,
  },
];

const packageCards: PackageCard[] = [
  {
    title: '5-Day Prototype',
    price: 'USD 2,500-4,000',
    note: 'One narrow channel or one narrow workflow',
    details: ['Fast proof of concept', 'One core handoff path', 'Walkthrough and next-step plan'],
  },
  {
    title: '7-14 Day Implementation',
    price: 'USD 5,000-10,000',
    note: 'Best fit for scoped client delivery',
    details: ['Full working delivery', 'Documentation and handoff', 'Fixed-scope milestone structure'],
    featured: true,
  },
  {
    title: 'Monthly Optimization',
    price: 'USD 1,500-3,500',
    note: 'For retained support after launch',
    details: ['Iteration and fixes', 'New workflows', 'Reporting and operating-cost tuning'],
  },
];

const projectLabels: Record<ProjectType, string> = {
  voice_sms: 'voice and SMS agent',
  multi_agent: 'multi-agent system',
  crm_scheduling: 'CRM and scheduling automation',
  workflow_automation: 'workflow automation build',
};

const deliveryLabels: Record<DeliveryShape, string> = {
  prototype: '5-day prototype',
  implementation: '7-14 day implementation',
  retainer: 'monthly optimization retainer',
};

const integrationLabels: Record<IntegrationType, string> = {
  twilio_openai: 'Twilio and OpenAI',
  n8n_stack: 'n8n and API orchestration',
  crm_calendar: 'CRM and calendar systems',
  email_slack: 'email, Slack, and operator alerts',
};

const getProposalPlan = (projectType: ProjectType, integration: IntegrationType) => {
  const integrationLabel = integrationLabels[integration];

  switch (projectType) {
    case 'voice_sms':
      return [
        `build the core ${projectLabels[projectType]} flow around ${integrationLabel}`,
        'keep the logic cost-aware with deterministic fallback paths',
        'handoff leads or appointments cleanly into the client workflow',
      ];
    case 'crm_scheduling':
      return [
        `connect ${integrationLabel} into one maintainable automation path`,
        'capture, qualify, and route leads without operator confusion',
        'document the workflow so it survives after launch',
      ];
    case 'multi_agent':
      return [
        `define the first working ${projectLabels[projectType]} path around ${integrationLabel}`,
        'set clear role boundaries and orchestration rules',
        'ship one observable workflow before expanding the system',
      ];
    case 'workflow_automation':
    default:
      return [
        `turn ${integrationLabel} into one reliable automation system`,
        'design for retries, ownership, and failure handling',
        'keep the build maintainable enough for a follow-on retainer',
      ];
  }
};

const outreachMailto = `mailto:?subject=${encodeURIComponent('AI automation build inquiry')}&body=${encodeURIComponent(
  'I want a fixed-scope AI automation proposal.\n\nProject:\nPrimary workflow:\nIntegrations:\nDesired delivery window:\n'
)}`;

const FreelanceAutomationLanding: React.FC = () => {
  const [clientName, setClientName] = React.useState('Northline Agency');
  const [projectType, setProjectType] = React.useState<ProjectType>('voice_sms');
  const [deliveryShape, setDeliveryShape] = React.useState<DeliveryShape>('implementation');
  const [integration, setIntegration] = React.useState<IntegrationType>('twilio_openai');
  const [copied, setCopied] = React.useState(false);

  const normalizedClient = clientName.trim() || 'your client';
  const proposalPoints = getProposalPlan(projectType, integration);
  const projectLabel = projectLabels[projectType];
  const deliveryLabel = deliveryLabels[deliveryShape];
  const integrationLabel = integrationLabels[integration];
  const priceRange =
    deliveryShape === 'prototype'
      ? 'USD 2,500-4,000'
      : deliveryShape === 'implementation'
        ? 'USD 5,000-10,000'
        : 'USD 1,500-3,500 per month';
  const firstMilestone =
    deliveryShape === 'prototype'
      ? 'define the single workflow, ship the first narrow path, and capture the next paid expansion'
      : deliveryShape === 'implementation'
        ? 'map the workflow, build the core system, then deliver documentation and handoff'
        : 'take over optimization, bug fixes, and the next workflow increments after launch';
  const proposalText = `Hi,

This looks like a strong fit for my background in AI workflow execution and business-side automation. I would approach ${normalizedClient}'s ${projectLabel} as a ${deliveryLabel} centered on ${integrationLabel}.

My recommended first focus would be:
1. ${proposalPoints[0]}
2. ${proposalPoints[1]}
3. ${proposalPoints[2]}

Suggested commercial shape:
- Delivery: ${deliveryLabel}
- Budget positioning: ${priceRange}
- First milestone: ${firstMilestone}

I build systems that do real work, not just demo chat flows, and I pay close attention to handoff logic, operating cost, and maintainability after launch.

Best,
<your name>`;
  const draftMailto = `mailto:?subject=${encodeURIComponent(`${normalizedClient} AI automation proposal`)}&body=${encodeURIComponent(proposalText)}`;

  const handleCopyProposal = async () => {
    try {
      await navigator.clipboard.writeText(proposalText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fa-root">
      <div className="fa-ambient fa-ambient-a" aria-hidden="true" />
      <div className="fa-ambient fa-ambient-b" aria-hidden="true" />

      <header className="fa-header">
        <div className="fa-shell fa-header-inner">
          <a href="/" className="fa-back-link">
            <ArrowLeft size={15} />
            Back To Main Website
          </a>
          <div className="fa-nav-actions">
            <a href="/hotel-pilot" className="fa-btn fa-btn-ghost">Hotel Pilot</a>
            <a href="/app" className="fa-btn">Open Live App</a>
          </div>
        </div>
      </header>

      <main>
        <section className="fa-hero">
          <div className="fa-shell fa-hero-grid">
            <div className="fa-hero-copy">
              <p className="fa-kicker">Freelance revenue lane</p>
              <h1>Sell fixed-scope AI automation builds that do real business work.</h1>
              <p className="fa-lead">
                This page packages the repo into a second money lane: voice agents, workflow automation, CRM routing, and multi-agent builds for buyers who need implementation more than a product subscription.
              </p>

              <div className="fa-hero-actions">
                <a href={outreachMailto} className="fa-btn">
                  Draft Inquiry Email
                  <ArrowRight size={16} />
                </a>
                <a href="/hotel-pilot" className="fa-btn fa-btn-ghost">View Hotel Pilot Lane</a>
              </div>

              <div className="fa-proof-strip">
                {heroPoints.map((item) => (
                  <span key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <aside className="fa-hero-panel">
              <div className="fa-chip-row">
                <span className="fa-chip is-live">Fast to cash</span>
                <span className="fa-chip">Fixed scope</span>
              </div>

              <div className="fa-metric-grid">
                <div className="fa-metric-card">
                  <MessagesSquare size={18} />
                  <strong>Voice + chat</strong>
                  <span>Inbound conversations with workflow handoff.</span>
                </div>
                <div className="fa-metric-card">
                  <CalendarSync size={18} />
                  <strong>CRM + scheduling</strong>
                  <span>Lead capture and appointment automation.</span>
                </div>
                <div className="fa-metric-card">
                  <Workflow size={18} />
                  <strong>Workflow systems</strong>
                  <span>Email, Slack, Sheets, APIs, and routing.</span>
                </div>
                <div className="fa-metric-card">
                  <Network size={18} />
                  <strong>Multi-agent builds</strong>
                  <span>Coordinated roles instead of one bot prompt.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="fa-section">
          <div className="fa-shell">
            <div className="fa-section-head">
              <p className="fa-kicker">What we can sell now</p>
              <h2>Package the repo as implementation capacity, not just one hospitality product.</h2>
              <p>
                The strongest freelance positioning here is full-stack AI execution with real handoff logic, not generic chatbot copy. That gives us a second lane while hotel pilots mature.
              </p>
            </div>

            <div className="fa-offer-grid">
              {offers.map((offer) => {
                const Icon = offer.icon;
                return (
                  <article key={offer.title} className="fa-card">
                    <span className="fa-card-icon">
                      <Icon size={18} />
                    </span>
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>
                    <ul>
                      {offer.points.map((point) => (
                        <li key={point}>
                          <CheckCircle2 size={15} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="fa-section fa-section-alt">
          <div className="fa-shell">
            <div className="fa-section-head">
              <p className="fa-kicker">Offer shapes</p>
              <h2>Sell narrow milestones first, then expand into bigger work or monthly support.</h2>
              <p>
                This matches the repo’s freelance playbook and makes it easier to convert proposal traffic into paid starts.
              </p>
            </div>

            <div className="fa-pricing-grid">
              {packageCards.map((card) => (
                <article key={card.title} className={`fa-pricing-card${card.featured ? ' is-featured' : ''}`}>
                  <p className="fa-price-tier">{card.title}</p>
                  <strong>{card.price}</strong>
                  <p className="fa-price-note">{card.note}</p>
                  <ul>
                    {card.details.map((detail) => (
                      <li key={detail}>
                        <CheckCircle2 size={15} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="fa-section">
          <div className="fa-shell">
            <div className="fa-section-head">
              <p className="fa-kicker">Proof</p>
              <h2>The freelance story is backed by real code in this repo.</h2>
              <p>
                These proof points help us lead with implementation credibility on Upwork, Freelancer, and direct outbound.
              </p>
            </div>

            <div className="fa-proof-grid">
              {proofCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="fa-proof-card">
                    <span className="fa-card-icon">
                      <Icon size={18} />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    <code>{card.file}</code>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="fa-section fa-section-dark">
          <div className="fa-shell fa-builder-layout">
            <div className="fa-builder-card">
              <div className="fa-section-head">
                <p className="fa-kicker">Proposal builder</p>
                <h2>Generate the next freelance proposal before you leave this page.</h2>
                <p>
                  This gives us a second copy-and-send tool so the repo helps with actual proposal volume, not just positioning.
                </p>
              </div>

              <div className="fa-field-grid">
                <label className="fa-field">
                  <span>Client or agency name</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    className="fa-input"
                    placeholder="Northline Agency"
                  />
                </label>

                <label className="fa-field">
                  <span>Project type</span>
                  <select
                    value={projectType}
                    onChange={(event) => setProjectType(event.target.value as ProjectType)}
                    className="fa-input"
                  >
                    <option value="voice_sms">Voice and SMS agent</option>
                    <option value="multi_agent">Multi-agent system</option>
                    <option value="crm_scheduling">CRM and scheduling automation</option>
                    <option value="workflow_automation">Workflow automation build</option>
                  </select>
                </label>

                <label className="fa-field">
                  <span>Delivery shape</span>
                  <select
                    value={deliveryShape}
                    onChange={(event) => setDeliveryShape(event.target.value as DeliveryShape)}
                    className="fa-input"
                  >
                    <option value="prototype">5-day prototype</option>
                    <option value="implementation">7-14 day implementation</option>
                    <option value="retainer">Monthly optimization retainer</option>
                  </select>
                </label>

                <label className="fa-field">
                  <span>Primary integration stack</span>
                  <select
                    value={integration}
                    onChange={(event) => setIntegration(event.target.value as IntegrationType)}
                    className="fa-input"
                  >
                    <option value="twilio_openai">Twilio and OpenAI</option>
                    <option value="n8n_stack">n8n and API orchestration</option>
                    <option value="crm_calendar">CRM and calendar systems</option>
                    <option value="email_slack">Email, Slack, and operator alerts</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="fa-output-card">
              <div className="fa-output-top">
                <div>
                  <p className="fa-output-label">Recommended angle</p>
                  <h3>{deliveryLabel}</h3>
                </div>
                <strong>{priceRange}</strong>
              </div>

              <div className="fa-output-meta">
                <span>{projectLabel}</span>
                <span>{integrationLabel}</span>
                <span>{normalizedClient}</span>
              </div>

              <pre className="fa-brief-text">{proposalText}</pre>

              <div className="fa-output-actions">
                <button type="button" onClick={handleCopyProposal} className="fa-btn fa-btn-button">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy Proposal'}
                </button>
                <a href={draftMailto} className="fa-btn fa-btn-ghost">Open Email Draft</a>
              </div>
            </div>
          </div>
        </section>

        <section className="fa-cta">
          <div className="fa-shell fa-cta-card">
            <div>
              <p className="fa-kicker">Next step</p>
              <h2>Use this as the second public lane while the hotel offer works the higher-ticket deals.</h2>
              <p>
                The hotel pilot is the bigger-ticket offer. This freelance lane is the faster fallback and should keep proposal volume moving every week.
              </p>
            </div>
            <div className="fa-cta-actions">
              <a href={outreachMailto} className="fa-btn">
                Start Outreach
                <Mail size={16} />
              </a>
              <a href="/" className="fa-btn fa-btn-ghost">Back To Main Site</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FreelanceAutomationLanding;
