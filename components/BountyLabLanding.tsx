import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  FileWarning,
  GitPullRequestArrow,
  Lock,
  Radar,
  Scale,
  ShieldAlert,
  TimerReset,
  type LucideIcon,
} from 'lucide-react';
import './BountyLabLanding.css';

type TrackCard = {
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

type ProgramCard = {
  title: string;
  note: string;
  detail: string;
  icon: LucideIcon;
};

type BountyMode = 'public_code' | 'security';
type SecurityPlatform = 'hacker101' | 'bugcrowd' | 'apple' | 'microsoft';
type CodePlatform = 'algora' | 'calcom' | 'github_watch';
type FocusArea = 'idor' | 'xss' | 'auth' | 'business_logic' | 'frontend_fix';

const trackCards: TrackCard[] = [
  {
    title: 'Public code bounties',
    description: 'Small but faster payouts from scoped TypeScript and UI issues where the repo already proves implementation depth.',
    points: ['Algora and Cal.com first', 'Avoid clearly reserved issues', 'Prefer isolated frontend or workflow tasks'],
    icon: GitPullRequestArrow,
  },
  {
    title: 'Security bug bounties',
    description: 'High-upside but lower-predictability work that needs scope discipline, target rules, and timeboxing.',
    points: ['One program at a time', 'Stay strictly in scope', 'Favor auth, IDOR, XSS, and business logic flaws'],
    icon: ShieldAlert,
  },
  {
    title: 'Triage before effort',
    description: 'The fastest bounty work comes from disciplined narrowing, not broad scanning or speculative rabbit holes.',
    points: ['Rate-limit research time', 'Document targets before testing', 'Write the report skeleton early'],
    icon: TimerReset,
  },
  {
    title: 'Proof already exists',
    description: 'The repo already carries notes, setup scripts, and a shortlist, so this lane can move immediately when sessions and targets are ready.',
    points: ['Environment bootstrap docs', 'Candidate shortlist', 'Revenue lane notes and constraints'],
    icon: BadgeDollarSign,
  },
];

const codePrograms: ProgramCard[] = [
  {
    title: 'Cal.com bounty board',
    note: 'First stop for public TypeScript issues',
    detail: 'The shortlist already points to lower-complexity UI and workflow tasks, with faster submission odds than broad client acquisition.',
    icon: GitPullRequestArrow,
  },
  {
    title: 'Algora TypeScript bounties',
    note: 'Best for small paid OSS work',
    detail: 'Useful for quick paid issues when the scope is isolated enough to finish in one focused build session.',
    icon: Radar,
  },
  {
    title: 'Reserved GitHub watches',
    note: 'Watch only unless ownership changes',
    detail: 'Issues that are already reserved should be tracked, not chased, so time stays on claimable paths.',
    icon: AlertTriangle,
  },
];

const securityPrograms: ProgramCard[] = [
  {
    title: 'Hacker101 / HackerOne',
    note: 'Training plus path to private programs',
    detail: 'Best near-term platform for sharpening web-app bounty instincts without guessing at scope.',
    icon: Bug,
  },
  {
    title: 'Bugcrowd',
    note: 'Broad public hacker platform',
    detail: 'Good when the account is active and the program rules are clear enough to keep testing inside bounds.',
    icon: ShieldAlert,
  },
  {
    title: 'Apple and Microsoft programs',
    note: 'Formal official bounty channels',
    detail: 'Higher-trust targets, but only when the published rules and approved surfaces are understood first.',
    icon: Lock,
  },
];

const securityPlatformLabels: Record<SecurityPlatform, string> = {
  hacker101: 'Hacker101 / HackerOne',
  bugcrowd: 'Bugcrowd',
  apple: 'Apple Security Bounty',
  microsoft: 'Microsoft Security Response Center',
};

const codePlatformLabels: Record<CodePlatform, string> = {
  algora: 'Algora',
  calcom: 'Cal.com bounty board',
  github_watch: 'GitHub watchlist issue',
};

const focusLabels: Record<FocusArea, string> = {
  idor: 'access control or IDOR',
  xss: 'stored or reflected XSS',
  auth: 'authentication or session flaws',
  business_logic: 'business logic flaws',
  frontend_fix: 'frontend or workflow implementation fix',
};

const getPlanLines = (
  mode: BountyMode,
  securityPlatform: SecurityPlatform,
  codePlatform: CodePlatform,
  focusArea: FocusArea,
  timeboxHours: string
) => {
  const focusLabel = focusLabels[focusArea];
  const timeboxLabel = `${timeboxHours || '2'} hour timebox`;

  if (mode === 'public_code') {
    const platformLabel = codePlatformLabels[codePlatform];
    return {
      title: `${platformLabel} claim plan`,
      summary: `Take a ${timeboxLabel} to confirm the issue scope, then decide whether it is small enough for one clean submission.`,
      bullets: [
        `pick the most isolated ${focusLabel} or workflow-related issue on ${platformLabel}`,
        'confirm it is not reserved, already assigned, or hiding large backend work',
        'write the implementation approach before touching code so the PR stays narrow',
      ],
      draft: `Bounty plan:
- Platform: ${platformLabel}
- Focus: ${focusLabel}
- Timebox: ${timeboxLabel}

Fastest next move:
1. confirm the issue is still open and claimable
2. map the likely files and testing surface
3. proceed only if the change still looks narrow enough for one submission session

If the scope expands beyond the initial claim, drop it quickly and move to the next bounty candidate.`,
    };
  }

  const platformLabel = securityPlatformLabels[securityPlatform];
  return {
    title: `${platformLabel} report plan`,
    summary: `Use a ${timeboxLabel} and stay strictly in published scope. Stop immediately if the surface is unclear or rate limits look risky.`,
    bullets: [
      `focus first on ${focusLabel} inside a clearly in-scope web target`,
      'write the report structure before deep testing so findings stay reproducible',
      'avoid broad active scanning, unclear targets, or any out-of-scope behavior',
    ],
    draft: `Responsible report draft:
- Program: ${platformLabel}
- Focus area: ${focusLabel}
- Timebox: ${timeboxLabel}

Potential issue summary:
[one sentence summary]

Affected asset:
[in-scope target only]

Steps to reproduce:
1. [step]
2. [step]
3. [step]

Observed impact:
[clear security impact only]

Suggested remediation:
[short practical fix]

Stop conditions:
- unclear scope
- excessive automation or rate-limit risk
- no reproducible security signal inside the timebox`,
  };
};

const BountyLabLanding: React.FC = () => {
  const [mode, setMode] = React.useState<BountyMode>('public_code');
  const [securityPlatform, setSecurityPlatform] = React.useState<SecurityPlatform>('hacker101');
  const [codePlatform, setCodePlatform] = React.useState<CodePlatform>('calcom');
  const [focusArea, setFocusArea] = React.useState<FocusArea>('frontend_fix');
  const [timeboxHours, setTimeboxHours] = React.useState('2');
  const [copied, setCopied] = React.useState(false);

  const plan = getPlanLines(mode, securityPlatform, codePlatform, focusArea, timeboxHours);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plan.draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bl-root">
      <div className="bl-ambient bl-ambient-a" aria-hidden="true" />
      <div className="bl-ambient bl-ambient-b" aria-hidden="true" />

      <header className="bl-header">
        <div className="bl-shell bl-header-inner">
          <a href="/" className="bl-back-link">
            <ArrowLeft size={15} />
            Back To Main Website
          </a>
          <div className="bl-nav-actions">
            <a href="/hotel-pilot" className="bl-btn bl-btn-ghost">Hotel Pilot</a>
            <a href="/automation-sprints" className="bl-btn bl-btn-ghost">Automation Sprints</a>
            <a href="/app" className="bl-btn">Open Live App</a>
          </div>
        </div>
      </header>

      <main>
        <section className="bl-hero">
          <div className="bl-shell bl-hero-grid">
            <div className="bl-hero-copy">
              <p className="bl-kicker">Bounty lane</p>
              <h1>Work bounties with discipline so time goes toward claimable money.</h1>
              <p className="bl-lead">
                This page turns the repo’s bounty notes into a working lane: public code bounties for faster smaller payouts, and security bug bounty work for disciplined upside when scope and rules are clear.
              </p>

              <div className="bl-hero-actions">
                <a href="#builder" className="bl-btn">
                  Open Plan Builder
                  <ArrowRight size={16} />
                </a>
                <a href="/automation-sprints" className="bl-btn bl-btn-ghost">Freelance Lane</a>
              </div>

              <div className="bl-proof-strip">
                <span><CheckCircle2 size={16} /> Public code bounties first for faster cash</span>
                <span><CheckCircle2 size={16} /> Security work only with clear scope</span>
                <span><CheckCircle2 size={16} /> Timebox hard to avoid wasted days</span>
              </div>
            </div>

            <aside className="bl-hero-panel">
              <div className="bl-chip-row">
                <span className="bl-chip is-code">Code</span>
                <span className="bl-chip is-security">Security</span>
              </div>

              <div className="bl-metric-grid">
                <div className="bl-metric-card">
                  <GitPullRequestArrow size={18} />
                  <strong>Cal.com + Algora</strong>
                  <span>Best near-term public code bounty surfaces.</span>
                </div>
                <div className="bl-metric-card">
                  <ShieldAlert size={18} />
                  <strong>One program only</strong>
                  <span>Security work stays scoped and explicit.</span>
                </div>
                <div className="bl-metric-card">
                  <Scale size={18} />
                  <strong>Rules first</strong>
                  <span>Published scope and rate limits before testing.</span>
                </div>
                <div className="bl-metric-card">
                  <TimerReset size={18} />
                  <strong>Hard timebox</strong>
                  <span>Drop low-signal paths fast and move on.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-shell">
            <div className="bl-section-head">
              <p className="bl-kicker">Tracks</p>
              <h2>Use bounties as controlled side lanes, not as open-ended wandering.</h2>
              <p>
                The repo’s own playbook already says public code bounties are smaller but faster, while security bounty work is high upside and low predictability. This page keeps that discipline visible.
              </p>
            </div>

            <div className="bl-track-grid">
              {trackCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="bl-card">
                    <span className="bl-card-icon">
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

        <section className="bl-section bl-section-alt">
          <div className="bl-shell bl-program-layout">
            <div>
              <div className="bl-section-head">
                <p className="bl-kicker">Public code bounties</p>
                <h2>Take the smaller, more claimable engineering wins first.</h2>
                <p>
                  This is the faster bounty path for the current setup: scoped TypeScript or UI work that can plausibly be completed in one focused build session.
                </p>
              </div>
              <div className="bl-program-grid">
                {codePrograms.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.title} className="bl-program-card">
                      <span className="bl-card-icon">
                        <Icon size={18} />
                      </span>
                      <h3>{card.title}</h3>
                      <strong>{card.note}</strong>
                      <p>{card.detail}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="bl-section-head">
                <p className="bl-kicker">Security bug bounties</p>
                <h2>Only pursue the upside when the scope and stop conditions are written down.</h2>
                <p>
                  Good first focus areas are auth flaws, IDOR, XSS, sensitive exposure, and business logic issues inside clearly published scope.
                </p>
              </div>
              <div className="bl-program-grid">
                {securityPrograms.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.title} className="bl-program-card">
                      <span className="bl-card-icon">
                        <Icon size={18} />
                      </span>
                      <h3>{card.title}</h3>
                      <strong>{card.note}</strong>
                      <p>{card.detail}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-shell">
            <div className="bl-section-head">
              <p className="bl-kicker">Environment proof</p>
              <h2>The repo already has bounty prep assets, so this lane is operationally ready.</h2>
              <p>
                The notes already define the local workspace, bootstrap scripts, focus areas, and shortlist. The missing part is repeated disciplined execution, not zero setup.
              </p>
            </div>

            <div className="bl-proof-grid">
              <article className="bl-proof-card">
                <span className="bl-card-icon"><Bug size={18} /></span>
                <h3>Bug bounty workspace</h3>
                <p>Dedicated local workspace and bootstrap guidance already exist for security research inside approved scope only.</p>
                <code>docs/ops/bug_bounty_setup_2026-03-31.md</code>
              </article>
              <article className="bl-proof-card">
                <span className="bl-card-icon"><FileWarning size={18} /></span>
                <h3>Watchlist and rules</h3>
                <p>Best-first platforms and avoid lists are already written down, which reduces random platform hopping.</p>
                <code>docs/ops/bug_bounty_watchlist_2026-03-31.md</code>
              </article>
              <article className="bl-proof-card">
                <span className="bl-card-icon"><BadgeDollarSign size={18} /></span>
                <h3>Code bounty shortlist</h3>
                <p>Public code bounty candidates are already triaged, with likely file paths and complexity notes.</p>
                <code>docs/ops/bounty_candidate_shortlist_2026-03-31.md</code>
              </article>
            </div>
          </div>
        </section>

        <section id="builder" className="bl-section bl-section-dark">
          <div className="bl-shell bl-builder-layout">
            <div className="bl-builder-card">
              <div className="bl-section-head">
                <p className="bl-kicker">Plan builder</p>
                <h2>Write the claim or report structure before spending the next session.</h2>
                <p>
                  This keeps bounty work honest. Pick the lane, choose the target style, set the focus area, and lock a timebox before doing deeper work.
                </p>
              </div>

              <div className="bl-field-grid">
                <label className="bl-field">
                  <span>Bounty lane</span>
                  <select value={mode} onChange={(event) => setMode(event.target.value as BountyMode)} className="bl-input">
                    <option value="public_code">Public code bounty</option>
                    <option value="security">Security bug bounty</option>
                  </select>
                </label>

                {mode === 'public_code' ? (
                  <label className="bl-field">
                    <span>Platform</span>
                    <select value={codePlatform} onChange={(event) => setCodePlatform(event.target.value as CodePlatform)} className="bl-input">
                      <option value="calcom">Cal.com bounty board</option>
                      <option value="algora">Algora</option>
                      <option value="github_watch">GitHub watchlist issue</option>
                    </select>
                  </label>
                ) : (
                  <label className="bl-field">
                    <span>Program</span>
                    <select value={securityPlatform} onChange={(event) => setSecurityPlatform(event.target.value as SecurityPlatform)} className="bl-input">
                      <option value="hacker101">Hacker101 / HackerOne</option>
                      <option value="bugcrowd">Bugcrowd</option>
                      <option value="apple">Apple Security Bounty</option>
                      <option value="microsoft">Microsoft Security Response Center</option>
                    </select>
                  </label>
                )}

                <label className="bl-field">
                  <span>Focus area</span>
                  <select value={focusArea} onChange={(event) => setFocusArea(event.target.value as FocusArea)} className="bl-input">
                    <option value="frontend_fix">Frontend or workflow fix</option>
                    <option value="business_logic">Business logic flaw</option>
                    <option value="auth">Authentication or session flaws</option>
                    <option value="idor">Access control or IDOR</option>
                    <option value="xss">Stored or reflected XSS</option>
                  </select>
                </label>

                <label className="bl-field">
                  <span>Timebox (hours)</span>
                  <input
                    type="number"
                    min="1"
                    value={timeboxHours}
                    onChange={(event) => setTimeboxHours(event.target.value)}
                    className="bl-input"
                    placeholder="2"
                  />
                </label>
              </div>
            </div>

            <div className="bl-output-card">
              <div className="bl-output-top">
                <div>
                  <p className="bl-output-label">Recommended next artifact</p>
                  <h3>{plan.title}</h3>
                </div>
                <strong>{mode === 'public_code' ? 'Claimable path' : 'Scoped report path'}</strong>
              </div>

              <p className="bl-output-summary">{plan.summary}</p>

              <ul className="bl-output-list">
                {plan.bullets.map((bullet) => (
                  <li key={bullet}>
                    <CheckCircle2 size={15} />
                    {bullet}
                  </li>
                ))}
              </ul>

              <pre className="bl-brief-text">{plan.draft}</pre>

              <div className="bl-output-actions">
                <button type="button" onClick={handleCopy} className="bl-btn bl-btn-button">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy Plan'}
                </button>
                <a href="/automation-sprints" className="bl-btn bl-btn-ghost">Back To Freelance Lane</a>
              </div>
            </div>
          </div>
        </section>

        <section className="bl-cta">
          <div className="bl-shell bl-cta-card">
            <div>
              <p className="bl-kicker">Next step</p>
              <h2>Run bounties as a disciplined side lane while hotel and freelance outreach keep carrying the main cash push.</h2>
              <p>
                Public code bounties are the faster small-win route. Security bounties stay optional upside unless there is a clearly in-scope and reproducible path.
              </p>
            </div>
            <div className="bl-cta-actions">
              <a href="#builder" className="bl-btn">
                Build Next Bounty Plan
                <ArrowRight size={16} />
              </a>
              <a href="/" className="bl-btn bl-btn-ghost">Back To Main Site</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BountyLabLanding;
