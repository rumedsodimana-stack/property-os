import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Gem,
  Landmark,
  MoonStar,
  PanelsTopLeft,
  Shield,
  Sparkles,
  SunMedium,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import './ThemeGallery.css';

type ThemeCard = {
  id: string;
  name: string;
  label: string;
  summary: string;
  bestFor: string;
  accent: string;
  accentSoft: string;
  bg: string;
  surface: string;
  panel: string;
  nav: string;
  text: string;
  muted: string;
  line: string;
  signal: string;
  icon: LucideIcon;
};

const themeCards: ThemeCard[] = [
  {
    id: 'codex-light-pro',
    name: 'Codex Light Pro',
    label: 'Editorial enterprise',
    summary: 'Cold paper whites, sharp cobalt controls, clean hierarchy, and structured dashboards.',
    bestFor: 'Operator-heavy PMS and multi-property command',
    accent: '#315efb',
    accentSoft: 'rgba(49, 94, 251, 0.12)',
    bg: '#f4f7fc',
    surface: '#ffffff',
    panel: '#ebf1f8',
    nav: '#e1e9f3',
    text: '#102138',
    muted: '#627289',
    line: '#cfdae8',
    signal: '#16a085',
    icon: PanelsTopLeft,
  },
  {
    id: 'executive-black',
    name: 'Executive Black',
    label: 'Luxury dark control room',
    summary: 'Obsidian shell with brass accents, smoked panels, and premium hotel-boardroom restraint.',
    bestFor: 'Luxury flags, GM reviews, owner demos',
    accent: '#caa35f',
    accentSoft: 'rgba(202, 163, 95, 0.14)',
    bg: '#0d0d0e',
    surface: '#151517',
    panel: '#1d1d20',
    nav: '#171719',
    text: '#f5efe2',
    muted: '#a39b8e',
    line: '#2b2a2c',
    signal: '#50c9a1',
    icon: MoonStar,
  },
  {
    id: 'riviera-sand',
    name: 'Riviera Sand',
    label: 'Warm resort daylight',
    summary: 'Ivory surfaces, sun-washed neutrals, and muted olive-blue accents with hospitality softness.',
    bestFor: 'Resorts, villas, leisure brands',
    accent: '#477d71',
    accentSoft: 'rgba(71, 125, 113, 0.13)',
    bg: '#f7f1e7',
    surface: '#fffaf1',
    panel: '#efe6d8',
    nav: '#e8dece',
    text: '#3c342d',
    muted: '#7f7366',
    line: '#d8cab7',
    signal: '#cf8a45',
    icon: SunMedium,
  },
  {
    id: 'ocean-control',
    name: 'Ocean Control',
    label: 'Marine operations',
    summary: 'Deep navy structure with sea-glass cyan accents and strong technical composure.',
    bestFor: 'Coastal brands, portfolio dashboards, tech-forward operators',
    accent: '#35b6d6',
    accentSoft: 'rgba(53, 182, 214, 0.15)',
    bg: '#081625',
    surface: '#102338',
    panel: '#14304b',
    nav: '#10263d',
    text: '#e6f4ff',
    muted: '#88a7bc',
    line: '#21445f',
    signal: '#3be0b8',
    icon: Waves,
  },
  {
    id: 'heritage-brass',
    name: 'Heritage Brass',
    label: 'Grand hotel classic',
    summary: 'Cream, walnut, brass, and forest notes designed to feel historic without looking old.',
    bestFor: 'Heritage properties and classic luxury hotels',
    accent: '#a57c3f',
    accentSoft: 'rgba(165, 124, 63, 0.14)',
    bg: '#f5efe4',
    surface: '#fffaf3',
    panel: '#ece1d0',
    nav: '#e3d4c0',
    text: '#332b23',
    muted: '#786b5d',
    line: '#d0bea8',
    signal: '#567046',
    icon: Landmark,
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimal',
    label: 'Restrained monochrome',
    summary: 'Quiet neutral system with strict spacing, pale slate surfaces, and one disciplined blue accent.',
    bestFor: 'Owners who want less brand drama and more clarity',
    accent: '#3569d8',
    accentSoft: 'rgba(53, 105, 216, 0.12)',
    bg: '#f2f4f7',
    surface: '#fbfcfe',
    panel: '#e9edf3',
    nav: '#e2e7ee',
    text: '#1a2330',
    muted: '#687687',
    line: '#ccd5e0',
    signal: '#0f9f92',
    icon: BriefcaseBusiness,
  },
  {
    id: 'aurora-glass',
    name: 'Aurora Glass',
    label: 'High-polish premium',
    summary: 'Translucent frosted shells with teal-to-ice highlights and a demo-forward premium feel.',
    bestFor: 'Sales demos and AI-first branding',
    accent: '#4ec7d9',
    accentSoft: 'rgba(78, 199, 217, 0.14)',
    bg: '#eaf8fb',
    surface: 'rgba(255, 255, 255, 0.8)',
    panel: 'rgba(216, 245, 248, 0.92)',
    nav: 'rgba(229, 250, 252, 0.94)',
    text: '#173544',
    muted: '#5f8390',
    line: '#c2e6ea',
    signal: '#7a6cf5',
    icon: Sparkles,
  },
  {
    id: 'terracotta-ledger',
    name: 'Terracotta Ledger',
    label: 'Warm operational depth',
    summary: 'Clay and stone layers with espresso text and warm ledger accents for boutique hospitality.',
    bestFor: 'Boutique, desert, and culturally rooted brands',
    accent: '#b55b3c',
    accentSoft: 'rgba(181, 91, 60, 0.14)',
    bg: '#f5ebe5',
    surface: '#fff8f3',
    panel: '#eeddd2',
    nav: '#e6d2c4',
    text: '#3b261f',
    muted: '#7f655a',
    line: '#d7c0b3',
    signal: '#8a8c39',
    icon: Building2,
  },
  {
    id: 'midnight-neon',
    name: 'Midnight Neon',
    label: 'AI command deck',
    summary: 'Very dark shell with electric cyan-lime energy for a sharper automation-led identity.',
    bestFor: 'AI-forward product positioning and innovation demos',
    accent: '#4fd8ff',
    accentSoft: 'rgba(79, 216, 255, 0.14)',
    bg: '#05070d',
    surface: '#0b1020',
    panel: '#11182c',
    nav: '#0b1324',
    text: '#e7f6ff',
    muted: '#7f97b2',
    line: '#1d2b44',
    signal: '#b7ff42',
    icon: Shield,
  },
  {
    id: 'singularity-luxury-light',
    name: 'Singularity Luxury Light',
    label: 'Flagship brand direction',
    summary: 'Refined white canvas with royal indigo, metallic amber, and a more ownable product identity.',
    bestFor: 'Main product brand for website and app',
    accent: '#3948c6',
    accentSoft: 'rgba(57, 72, 198, 0.14)',
    bg: '#f6f5fb',
    surface: '#ffffff',
    panel: '#eceffd',
    nav: '#e5e8f8',
    text: '#171d3a',
    muted: '#6d7395',
    line: '#cfd5ee',
    signal: '#d39d4f',
    icon: Gem,
  },
];

const previewBars = [44, 68, 60, 82, 76, 92, 84];

const ThemeGallery: React.FC = () => {
  return (
    <div className="tg-root">
      <div className="tg-ambient tg-ambient-a" aria-hidden="true" />
      <div className="tg-ambient tg-ambient-b" aria-hidden="true" />

      <header className="tg-shell tg-header">
        <div>
          <p className="tg-kicker">Preview Lab</p>
          <h1>Theme Gallery</h1>
          <p className="tg-intro">
            Every option is shown side-by-side here first. Nothing on this page changes your live app theme.
          </p>
        </div>
        <div className="tg-actions">
          <a href="/" className="tg-btn tg-btn-secondary">
            <ArrowLeft size={15} />
            Back To Website
          </a>
          <a href="/app" className="tg-btn">
            Open Current App
            <ArrowRight size={15} />
          </a>
        </div>
      </header>

      <main className="tg-shell tg-grid">
        {themeCards.map((theme) => {
          const Icon = theme.icon;
          return (
            <article
              key={theme.id}
              className="tg-card"
              style={
                {
                  '--tg-bg': theme.bg,
                  '--tg-surface': theme.surface,
                  '--tg-panel': theme.panel,
                  '--tg-nav': theme.nav,
                  '--tg-text': theme.text,
                  '--tg-muted': theme.muted,
                  '--tg-line': theme.line,
                  '--tg-accent': theme.accent,
                  '--tg-accent-soft': theme.accentSoft,
                  '--tg-signal': theme.signal,
                } as React.CSSProperties
              }
            >
              <div className="tg-card-head">
                <div className="tg-theme-meta">
                  <div className="tg-icon-wrap">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="tg-theme-label">{theme.label}</p>
                    <h2>{theme.name}</h2>
                  </div>
                </div>
                <span className="tg-badge">Preview only</span>
              </div>

              <div className="tg-preview">
                <div className="tg-preview-sidebar">
                  <div className="tg-preview-brand">
                    <span className="tg-preview-mark">S</span>
                    <span>Singularity</span>
                  </div>
                  <div className="tg-preview-nav">
                    <span className="is-active">Front Desk</span>
                    <span>Housekeeping</span>
                    <span>Finance</span>
                    <span>AI Command</span>
                  </div>
                </div>

                <div className="tg-preview-main">
                  <div className="tg-preview-toolbar">
                    <span className="tg-preview-pill">Today</span>
                    <span className="tg-preview-dot" />
                    <span className="tg-preview-status">System healthy</span>
                  </div>

                  <div className="tg-preview-kpis">
                    <div>
                      <strong>82%</strong>
                      <span>Occupancy</span>
                    </div>
                    <div>
                      <strong>$24k</strong>
                      <span>Revenue</span>
                    </div>
                    <div>
                      <strong>12</strong>
                      <span>Arrivals</span>
                    </div>
                  </div>

                  <div className="tg-preview-chart">
                    {previewBars.map((height, index) => (
                      <span key={theme.id + '_bar_' + index} style={{ height: `${height}%` }} />
                    ))}
                  </div>

                  <div className="tg-preview-bottom">
                    <div className="tg-preview-list">
                      <div>
                        <span>VIP arrivals</span>
                        <strong>3</strong>
                      </div>
                      <div>
                        <span>Balance due</span>
                        <strong>5</strong>
                      </div>
                    </div>
                    <button className="tg-preview-cta">Open Shift Queue</button>
                  </div>
                </div>
              </div>

              <p className="tg-summary">{theme.summary}</p>

              <div className="tg-foot">
                <span className="tg-chip">Best for: {theme.bestFor}</span>
                <span className="tg-chip tg-chip-accent">Accent system</span>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
};

export default ThemeGallery;
