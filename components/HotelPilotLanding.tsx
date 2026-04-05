import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  Hotel,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import './HotelPilotLanding.css';

type FeatureCard = {
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

type StepCard = {
  label: string;
  title: string;
  description: string;
  points: string[];
};

type ProofCard = {
  title: string;
  description: string;
  file: string;
  icon: LucideIcon;
};

type PricingCard = {
  tier: string;
  price: string;
  note: string;
  details: string[];
  featured?: boolean;
};

type PilotFootprint = 'single' | 'group';
type PilotPriority = 'bookings' | 'upsells' | 'staff' | 'standardization';
type PilotChannel = 'website_chat' | 'whatsapp' | 'reservations_inbox' | 'email_concierge';

const offerHighlights = [
  'Recover missed reservation demand after hours',
  'Surface paid upsells during guest conversations',
  'Route requests into real hotel operations',
];

const outcomes: FeatureCard[] = [
  {
    title: 'Direct demand recovery',
    description:
      'Keep reservation intent alive when the front desk is offline, overloaded, or handling in-person guests.',
    points: ['Capture booking intent from web or messaging', 'Queue handoff-ready leads for staff', 'Reduce silent OTA leakage'],
    icon: TrendingUp,
  },
  {
    title: 'Paid upsell prompts',
    description:
      'Package common ancillary offers into one controlled launch instead of building a broad custom commerce layer.',
    points: ['Early check-in and late checkout', 'Upgrade, breakfast, parking, spa', 'Simple offer rules with staff approval'],
    icon: Wallet,
  },
  {
    title: 'Ops handoff without dead ends',
    description:
      'The pilot is designed to create work for teams, not trap guests inside a chatbot loop that nobody owns.',
    points: ['Housekeeping and maintenance routing', 'Front desk follow-up tasks', 'Human escalation for edge cases'],
    icon: Workflow,
  },
  {
    title: 'Manager proof every week',
    description:
      'Leadership gets a small KPI layer tied to workload and revenue so the pilot can be judged on outcomes, not novelty.',
    points: ['Lead volume and request volume', 'Response-speed and upsell activity', 'Fixed-scope weekly summary'],
    icon: ShieldCheck,
  },
];

const launchPlan: StepCard[] = [
  {
    label: 'Days 1-3',
    title: 'Property setup',
    description: 'Lock one property, one guest-facing channel, one knowledge base, and one operating owner.',
    points: ['Load core FAQ and service rules', 'Define human handoff boundaries', 'Pick the first upsell bundle'],
  },
  {
    label: 'Days 4-7',
    title: 'Guest journeys and routing',
    description: 'Wire guest intents to real operational destinations so requests land with the right team immediately.',
    points: ['Reservation and concierge flows', 'Front desk, housekeeping, and maintenance routing', 'Payment path for paid add-ons'],
  },
  {
    label: 'Days 8-14',
    title: 'Live pilot and KPI review',
    description: 'Run the narrow launch, tune the handoffs, and report the first revenue and workload signals back to management.',
    points: ['Daily signal review', 'Weekly management summary', 'Go / no-go decision for expansion'],
  },
];

const proofCards: ProofCard[] = [
  {
    title: 'AI coordination already exists',
    description: 'The agent layer is already structured for role-aware hotel workflows instead of generic chat behavior.',
    file: 'services/intelligence/agentService.ts',
    icon: Sparkles,
  },
  {
    title: 'Guest requests already route into ops',
    description: 'Service-intake logic is already present, which lowers the cost of turning concierge requests into action.',
    file: 'services/operations/guestActionService.ts',
    icon: MessageSquare,
  },
  {
    title: 'Payments are already part of the stack',
    description: 'The repo already includes payment capture paths, which makes paid add-ons credible instead of aspirational.',
    file: 'services/payments/paymentService.ts',
    icon: Wallet,
  },
  {
    title: 'Distribution hooks are in place',
    description: 'OTA and integration hooks already exist, which strengthens the direct-demand recovery story.',
    file: 'services/integrations/otaService.ts',
    icon: Building2,
  },
];

const pricingCards: PricingCard[] = [
  {
    tier: 'Single Property Pilot',
    price: 'USD 15,000',
    note: '60% before kickoff, 40% on go-live week',
    details: ['One property', 'One primary guest channel', 'One upsell bundle', 'Weekly KPI summary'],
    featured: true,
  },
  {
    tier: 'Small Group Pilot',
    price: 'USD 25,000-35,000',
    note: 'Up to 3 properties with one shared rollout plan',
    details: ['Small management groups', 'Standardized handoff rules', 'Shared management reporting', 'Controlled phased launch'],
  },
  {
    tier: 'Ongoing Support',
    price: 'USD 2,000-5,000',
    note: 'Monthly optimization after the pilot proves value',
    details: ['Offer tuning', 'Prompt and workflow iteration', 'Reporting support', 'Expansion planning'],
  },
];

const faqCards = [
  {
    title: 'Will this replace staff?',
    body: 'No. The offer is intentionally framed as staff support: faster answers, cleaner handoffs, and more revenue capture without adding headcount first.',
  },
  {
    title: 'How narrow is the first launch?',
    body: 'One property, one channel, one upsell set, and clear owners. That is the constraint that makes the 14-day promise believable.',
  },
  {
    title: 'What makes the pilot credible now?',
    body: 'The stack already has the core pieces: agent orchestration, guest routing, payments, and OTA hooks. This page simply packages them into a sellable offer.',
  },
];

const channelLabels: Record<PilotChannel, string> = {
  website_chat: 'website chat',
  whatsapp: 'WhatsApp',
  reservations_inbox: 'the reservations inbox',
  email_concierge: 'the guest email concierge',
};

const priorityLabels: Record<PilotPriority, string> = {
  bookings: 'recover direct-booking demand',
  upsells: 'increase paid upsell conversion',
  staff: 'reduce front desk load',
  standardization: 'standardize a small portfolio rollout',
};

const getPriorityPlan = (priority: PilotPriority, channel: PilotChannel) => {
  const channelLabel = channelLabels[channel];

  switch (priority) {
    case 'upsells':
      return [
        `drive paid add-ons through ${channelLabel}`,
        'connect accepted offers to payment and operating handoff',
        'report weekly on conversion, requests, and staff load',
      ];
    case 'staff':
      return [
        `deflect repetitive guest questions coming through ${channelLabel}`,
        'route housekeeping, maintenance, and front desk work automatically',
        'keep one light upsell layer for revenue capture without operator overload',
      ];
    case 'standardization':
      return [
        `standardize guest-response rules coming from ${channelLabel}`,
        'pilot on one flagship property before a broader rollout',
        'show management one KPI view for workload and revenue proof',
      ];
    case 'bookings':
    default:
      return [
        `recover missed reservation and direct-booking demand from ${channelLabel}`,
        'reduce repetitive guest-service load on the front desk',
        'surface paid upsells such as upgrades, early check-in, and late checkout',
      ];
  }
};

const inquiryMailto = `mailto:?subject=${encodeURIComponent('14-day Hotel AI Pilot outline')}&body=${encodeURIComponent(
  'I want the 3-point pilot outline for my property.\n\nProperty:\nRooms:\nPrimary guest channel:\nTop goal:\nDesired go-live window:\n'
)}`;

const HotelPilotLanding: React.FC = () => {
  const [propertyName, setPropertyName] = React.useState('Harbor View Hotel');
  const [roomCount, setRoomCount] = React.useState('120');
  const [footprint, setFootprint] = React.useState<PilotFootprint>('single');
  const [channel, setChannel] = React.useState<PilotChannel>('website_chat');
  const [priority, setPriority] = React.useState<PilotPriority>('bookings');
  const [copied, setCopied] = React.useState(false);

  const normalizedName = propertyName.trim() || 'your property';
  const parsedRoomCount = Number.parseInt(roomCount, 10);
  const resolvedRoomCount = Number.isFinite(parsedRoomCount) && parsedRoomCount > 0 ? parsedRoomCount : 0;
  const isGroupPilot = footprint === 'group' || resolvedRoomCount >= 250 || priority === 'standardization';
  const packageTier = isGroupPilot ? 'Small group pilot' : 'Single-property pilot';
  const packagePrice = isGroupPilot ? 'USD 25,000-35,000 upfront' : 'USD 15,000 upfront';
  const scopeLine = isGroupPilot
    ? 'Start with one flagship property, one shared rule set, and one weekly management summary before expanding.'
    : 'Keep launch scope to one property, one guest-facing channel, one upsell bundle, and one operating owner.';
  const planPoints = getPriorityPlan(priority, channel);
  const channelLabel = channelLabels[channel];
  const priorityLabel = priorityLabels[priority];
  const briefText = `Thanks for the reply. The fastest way to test this at ${normalizedName} is a fixed-scope 14-day ${packageTier.toLowerCase()} focused on three outcomes:

1. ${planPoints[0]}
2. ${planPoints[1]}
3. ${planPoints[2]}

Recommended structure:
- Property size: ${resolvedRoomCount > 0 ? `${resolvedRoomCount} rooms` : 'room count to confirm'}
- Primary channel: ${channelLabel}
- Commercial focus: ${priorityLabel}
- Package: ${packageTier} at ${packagePrice}
- Scope: ${scopeLine}

If helpful, I can send a tighter KPI outline and launch checklist for this exact setup.`;
  const draftMailto = `mailto:?subject=${encodeURIComponent(`${normalizedName} 14-day hotel pilot outline`)}&body=${encodeURIComponent(briefText)}`;

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="hp-root">
      <div className="hp-ambient hp-ambient-a" aria-hidden="true" />
      <div className="hp-ambient hp-ambient-b" aria-hidden="true" />

      <header className="hp-header">
        <div className="hp-shell hp-header-inner">
          <a href="/" className="hp-back-link">
            <ArrowLeft size={15} />
            Back To Main Website
          </a>
          <div className="hp-nav-actions">
            <a href="/theme-gallery" className="hp-btn hp-btn-ghost">Theme Gallery</a>
            <a href="/app" className="hp-btn">Open Live App</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hp-hero">
          <div className="hp-shell hp-hero-grid">
            <div className="hp-hero-copy">
              <p className="hp-kicker">Hotel pilot offer</p>
              <h1>Launch a 14-day AI reservations and concierge pilot that is tied to revenue, not hype.</h1>
              <p className="hp-lead">
                Hotel Singularity OS already runs guest routing, payments, operations handoff, and hotel workflow logic. This pilot turns those assets into one sellable rollout for independent hotels and small groups that want faster guest response and more paid add-ons.
              </p>

              <div className="hp-hero-actions">
                <a href={inquiryMailto} className="hp-btn">
                  Request 3-Point Outline
                  <ArrowRight size={16} />
                </a>
                <a href="/app" className="hp-btn hp-btn-ghost">Open Live Ops Build</a>
              </div>

              <div className="hp-proof-strip">
                {offerHighlights.map((item) => (
                  <span key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <aside className="hp-hero-panel">
              <div className="hp-panel-chip-row">
                <span className="hp-chip is-warm">Fixed scope</span>
                <span className="hp-chip">Human-led rollout</span>
              </div>

              <div className="hp-metric-grid">
                <div className="hp-metric-card">
                  <Clock3 size={18} />
                  <strong>14 days</strong>
                  <span>One launch window with clear boundaries.</span>
                </div>
                <div className="hp-metric-card">
                  <Hotel size={18} />
                  <strong>1 property first</strong>
                  <span>Start narrow before expanding to a group.</span>
                </div>
                <div className="hp-metric-card">
                  <Wallet size={18} />
                  <strong>USD 15k entry</strong>
                  <span>Single-property pilot positioning.</span>
                </div>
                <div className="hp-metric-card">
                  <ShieldCheck size={18} />
                  <strong>Weekly KPI summary</strong>
                  <span>Lead volume, requests, and upsell activity.</span>
                </div>
              </div>

              <div className="hp-fit-card">
                <p className="hp-fit-label">Best fit</p>
                <ul>
                  <li>Independent hotels with lean front-desk teams</li>
                  <li>Boutique or lifestyle properties with strong guest messaging volume</li>
                  <li>Small groups that want one property proving ground before a broader rollout</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section id="outcomes" className="hp-section">
          <div className="hp-shell">
            <div className="hp-section-head">
              <p className="hp-kicker">What changes</p>
              <h2>The offer is small enough to buy and strong enough to matter.</h2>
              <p>
                This is not a vague AI transformation pitch. It is a narrow pilot with revenue, workload, and ownership outcomes that hotel teams can judge quickly.
              </p>
            </div>

            <div className="hp-feature-grid">
              {outcomes.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="hp-card">
                    <span className="hp-card-icon">
                      <Icon size={18} />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    <ul>
                      {card.points.map((point) => (
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

        <section id="scope" className="hp-section hp-section-alt">
          <div className="hp-shell hp-plan-layout">
            <div>
              <div className="hp-section-head">
                <p className="hp-kicker">Launch shape</p>
                <h2>Keep the first deal constrained so it gets approved and shipped.</h2>
                <p>
                  The pilot works because it avoids enterprise sprawl. One channel, one property knowledge base, one upsell bundle, and one management reporting loop.
                </p>
              </div>

              <div className="hp-constraint-card">
                <h3>Non-negotiables</h3>
                <ul>
                  <li>
                    <CheckCircle2 size={15} />
                    No free custom builds
                  </li>
                  <li>
                    <CheckCircle2 size={15} />
                    Fixed scope before expansion
                  </li>
                  <li>
                    <CheckCircle2 size={15} />
                    Revenue or workload KPIs agreed before kickoff
                  </li>
                  <li>
                    <CheckCircle2 size={15} />
                    One operating owner inside the property
                  </li>
                </ul>
              </div>
            </div>

            <div className="hp-timeline">
              {launchPlan.map((step) => (
                <article key={step.label} className="hp-step-card">
                  <p className="hp-step-label">{step.label}</p>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <ul>
                    {step.points.map((point) => (
                      <li key={point}>
                        <CheckCircle2 size={15} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="proof" className="hp-section">
          <div className="hp-shell">
            <div className="hp-section-head">
              <p className="hp-kicker">Why now</p>
              <h2>The pilot is anchored in code that already exists inside this repo.</h2>
              <p>
                The sales story gets stronger when the destination is real. These modules make the pilot credible today instead of waiting on a separate implementation sprint.
              </p>
            </div>

            <div className="hp-proof-grid">
              {proofCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="hp-proof-card">
                    <span className="hp-card-icon">
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

        <section id="pricing" className="hp-section hp-section-dark">
          <div className="hp-shell">
            <div className="hp-section-head">
              <p className="hp-kicker">Pricing</p>
              <h2>Lead with the single-property pilot, then expand only after proof.</h2>
              <p>
                The pricing is framed for fixed-scope commitment. The fastest close is one property, one decision-maker, and one measurable outcome path.
              </p>
            </div>

            <div className="hp-pricing-grid">
              {pricingCards.map((card) => (
                <article key={card.tier} className={`hp-pricing-card${card.featured ? ' is-featured' : ''}`}>
                  <p className="hp-price-tier">{card.tier}</p>
                  <strong>{card.price}</strong>
                  <p className="hp-price-note">{card.note}</p>
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

        <section className="hp-section">
          <div className="hp-shell hp-builder-layout">
            <div className="hp-builder-card">
              <div className="hp-section-head">
                <p className="hp-kicker">Close faster</p>
                <h2>Build the property-specific pilot brief before the next sales reply.</h2>
                <p>
                  This turns the offer into a usable sales tool. Adjust the basics below and the page will generate a tighter 3-point outline you can copy or send immediately.
                </p>
              </div>

              <div className="hp-field-grid">
                <label className="hp-field">
                  <span>Property or group name</span>
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(event) => setPropertyName(event.target.value)}
                    className="hp-input"
                    placeholder="Harbor View Hotel"
                  />
                </label>

                <label className="hp-field">
                  <span>Room count</span>
                  <input
                    type="number"
                    min="0"
                    value={roomCount}
                    onChange={(event) => setRoomCount(event.target.value)}
                    className="hp-input"
                    placeholder="120"
                  />
                </label>

                <label className="hp-field">
                  <span>Launch shape</span>
                  <select
                    value={footprint}
                    onChange={(event) => setFootprint(event.target.value as PilotFootprint)}
                    className="hp-input"
                  >
                    <option value="single">Single property</option>
                    <option value="group">Small group</option>
                  </select>
                </label>

                <label className="hp-field">
                  <span>Primary channel</span>
                  <select
                    value={channel}
                    onChange={(event) => setChannel(event.target.value as PilotChannel)}
                    className="hp-input"
                  >
                    <option value="website_chat">Website chat</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="reservations_inbox">Reservations inbox</option>
                    <option value="email_concierge">Guest email concierge</option>
                  </select>
                </label>

                <label className="hp-field hp-field-wide">
                  <span>Primary commercial goal</span>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as PilotPriority)}
                    className="hp-input"
                  >
                    <option value="bookings">Recover direct bookings</option>
                    <option value="upsells">Increase paid upsells</option>
                    <option value="staff">Reduce front desk load</option>
                    <option value="standardization">Standardize a small group rollout</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="hp-output-card">
              <div className="hp-output-top">
                <div>
                  <p className="hp-output-label">Recommended package</p>
                  <h3>{packageTier}</h3>
                </div>
                <strong>{packagePrice}</strong>
              </div>

              <div className="hp-output-meta">
                <span>{resolvedRoomCount > 0 ? `${resolvedRoomCount} rooms` : 'Room count pending'}</span>
                <span>{channelLabel}</span>
                <span>{priorityLabel}</span>
              </div>

              <p className="hp-output-scope">{scopeLine}</p>

              <pre className="hp-brief-text">{briefText}</pre>

              <div className="hp-output-actions">
                <button type="button" onClick={handleCopyBrief} className="hp-btn hp-btn-button">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy Brief'}
                </button>
                <a href={draftMailto} className="hp-btn hp-btn-ghost">Open Email Draft</a>
              </div>
            </div>
          </div>
        </section>

        <section className="hp-section">
          <div className="hp-shell hp-faq-layout">
            <div>
              <div className="hp-section-head">
                <p className="hp-kicker">Objections handled early</p>
                <h2>Position it as controlled revenue support, not staff replacement.</h2>
                <p>
                  That framing matches the repo, the offer docs, and the kind of buyer who can say yes to a short pilot without a full procurement cycle.
                </p>
              </div>
            </div>

            <div className="hp-faq-grid">
              {faqCards.map((item) => (
                <article key={item.title} className="hp-faq-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-cta">
          <div className="hp-shell hp-cta-card">
            <div>
              <p className="hp-kicker">Next step</p>
              <h2>Use this page as the focused destination for outbound hotel outreach.</h2>
              <p>
                If a prospect asks for more detail, the cleanest next move is a 3-point outline for one property, one channel, and one revenue target.
              </p>
            </div>
            <div className="hp-cta-actions">
              <a href={inquiryMailto} className="hp-btn">
                Draft Inquiry Email
                <ArrowRight size={16} />
              </a>
              <a href="/" className="hp-btn hp-btn-ghost">Back To Main Site</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HotelPilotLanding;
