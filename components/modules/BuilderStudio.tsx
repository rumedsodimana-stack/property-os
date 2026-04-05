import React, { useState, useCallback, useRef } from 'react';
import {
  Code2, Play, History, Sparkles, FileCode, Copy, Check,
  ChevronRight, Loader2, ToggleLeft, ToggleRight, Trash2,
  Wand2, ArrowRight, AlertTriangle, CheckCircle2, Download,
  Layers, GitBranch
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  skeleton: string;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  confidence: number;
}

interface HistoryEntry {
  id: string;
  prompt: string;
  template: string;
  timestamp: string;
  status: 'success' | 'error';
  linesGenerated: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'react-module', name: 'React Module', description: 'Full-page module with header, body, footer',
    icon: '⚛️', category: 'Components',
    skeleton: `import React, { useState } from 'react';\n\nconst ModuleName: React.FC = () => {\n  return (\n    <div className="module-container">\n      <header className="module-header">\n        <h2>Module Title</h2>\n      </header>\n      <main className="module-body">\n        {/* Content here */}\n      </main>\n    </div>\n  );\n};\n\nexport default ModuleName;`,
  },
  {
    id: 'service-class', name: 'Service Class', description: 'Singleton service with CRUD operations',
    icon: '🔧', category: 'Services',
    skeleton: `class ServiceName {\n  private static instance: ServiceName;\n\n  static getInstance(): ServiceName {\n    if (!this.instance) this.instance = new ServiceName();\n    return this.instance;\n  }\n\n  async getAll(): Promise<any[]> {\n    return [];\n  }\n\n  async getById(id: string): Promise<any | null> {\n    return null;\n  }\n\n  async create(data: any): Promise<any> {\n    return data;\n  }\n\n  async update(id: string, data: any): Promise<any> {\n    return { id, ...data };\n  }\n\n  async delete(id: string): Promise<boolean> {\n    return true;\n  }\n}\n\nexport const serviceName = ServiceName.getInstance();`,
  },
  {
    id: 'dashboard-card', name: 'Dashboard Card', description: 'Stat card with trend indicator',
    icon: '📊', category: 'Components',
    skeleton: `interface StatCardProps {\n  title: string;\n  value: string;\n  trend: string;\n  positive: boolean;\n  icon: React.ReactNode;\n}\n\nconst StatCard: React.FC<StatCardProps> = ({ title, value, trend, positive, icon }) => (\n  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">\n    <div className="flex justify-between items-start mb-4">\n      <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-white/5">{icon}</div>\n      <span className={\`text-[10px] font-bold px-2 py-1 rounded-lg \${positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}\`}>{trend}</span>\n    </div>\n    <div className="text-2xl font-light text-white mb-1">{value}</div>\n    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{title}</div>\n  </div>\n);`,
  },
  {
    id: 'api-route', name: 'API Route', description: 'Firebase Cloud Function endpoint',
    icon: '🌐', category: 'Backend',
    skeleton: `import * as functions from 'firebase-functions';\nimport * as admin from 'firebase-admin';\n\nexport const endpointName = functions.https.onRequest(async (req, res) => {\n  try {\n    if (req.method !== 'POST') {\n      res.status(405).json({ error: 'Method not allowed' });\n      return;\n    }\n\n    const { data } = req.body;\n    // Process data...\n\n    res.status(200).json({ success: true, data });\n  } catch (error: any) {\n    res.status(500).json({ error: error.message });\n  }\n});`,
  },
  {
    id: 'type-interface', name: 'Type Definitions', description: 'TypeScript interfaces and enums',
    icon: '📝', category: 'Types',
    skeleton: `export type StatusType = 'active' | 'inactive' | 'pending';\n\nexport interface EntityName {\n  id: string;\n  name: string;\n  status: StatusType;\n  metadata: Record<string, any>;\n  createdAt: string;\n  updatedAt: string;\n}\n\nexport interface EntityListResponse {\n  items: EntityName[];\n  total: number;\n  page: number;\n  pageSize: number;\n}`,
  },
  {
    id: 'hook-custom', name: 'Custom Hook', description: 'React hook with state and effects',
    icon: '🪝', category: 'Hooks',
    skeleton: `import { useState, useEffect, useCallback } from 'react';\n\ninterface UseHookNameOptions {\n  initialValue?: string;\n  autoFetch?: boolean;\n}\n\nexport function useHookName(options: UseHookNameOptions = {}) {\n  const [data, setData] = useState<any>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  const fetch = useCallback(async () => {\n    setLoading(true);\n    setError(null);\n    try {\n      // fetch logic\n      setData(null);\n    } catch (e: any) {\n      setError(e.message);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    if (options.autoFetch) fetch();\n  }, [options.autoFetch, fetch]);\n\n  return { data, loading, error, refetch: fetch };\n}`,
  },
];

const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))];

const MOCK_SUGGESTIONS: AISuggestion[] = [
  {
    id: 's1', title: 'Add error boundary', confidence: 92,
    description: 'Wrap component in ErrorBoundary for graceful failure handling',
    code: `class ErrorBoundary extends React.Component<\n  { children: React.ReactNode },\n  { hasError: boolean }\n> {\n  state = { hasError: false };\n  static getDerivedStateFromError() {\n    return { hasError: true };\n  }\n  render() {\n    if (this.state.hasError) {\n      return <div className="text-rose-400 p-4">Something went wrong.</div>;\n    }\n    return this.props.children;\n  }\n}`,
  },
  {
    id: 's2', title: 'Add loading skeleton', confidence: 87,
    description: 'Shimmer loading state for better perceived performance',
    code: `const Skeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (\n  <div className="space-y-3 animate-pulse">\n    {Array.from({ length: lines }).map((_, i) => (\n      <div key={i} className="h-4 bg-zinc-800 rounded-lg" style={{ width: \`\${70 + Math.random() * 30}%\` }} />\n    ))}\n  </div>\n);`,
  },
  {
    id: 's3', title: 'Add keyboard shortcut', confidence: 78,
    description: 'Register Ctrl+S handler for save action',
    code: `useEffect(() => {\n  const handler = (e: KeyboardEvent) => {\n    if ((e.metaKey || e.ctrlKey) && e.key === 's') {\n      e.preventDefault();\n      handleSave();\n    }\n  };\n  window.addEventListener('keydown', handler);\n  return () => window.removeEventListener('keydown', handler);\n}, []);`,
  },
];

const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'h1', prompt: 'Create guest check-in form component', template: 'React Module', timestamp: '12:34 PM', status: 'success', linesGenerated: 142 },
  { id: 'h2', prompt: 'Build inventory tracking service', template: 'Service Class', timestamp: '11:08 AM', status: 'success', linesGenerated: 98 },
  { id: 'h3', prompt: 'Add room type interface definitions', template: 'Type Definitions', timestamp: '10:45 AM', status: 'success', linesGenerated: 54 },
  { id: 'h4', prompt: 'Create payment processing endpoint', template: 'API Route', timestamp: 'Yesterday', status: 'error', linesGenerated: 0 },
  { id: 'h5', prompt: 'Build useReservation custom hook', template: 'Custom Hook', timestamp: 'Yesterday', status: 'success', linesGenerated: 76 },
];

// ─── Component ───────────────────────────────────────────────────────────────

const BuilderStudio: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [originalCode, setOriginalCode] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredTemplates = filterCategory
    ? TEMPLATES.filter(t => t.category === filterCategory)
    : TEMPLATES;

  const handleSelectTemplate = useCallback((t: Template) => {
    setSelectedTemplate(t);
    setCode(t.skeleton);
    setOriginalCode(t.skeleton);
    setShowDiff(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    const generated = `// AI-Generated from prompt: "${prompt}"\n// Template: ${selectedTemplate?.name || 'None'}\n// Generated at: ${new Date().toLocaleTimeString()}\n\n${code}\n\n// TODO: AI would expand this based on prompt context`;
    setOriginalCode(code);
    setCode(generated);
    setGenerating(false);
  }, [prompt, selectedTemplate, code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    setOriginalCode(code);
    setCode(prev => `${prev}\n\n// --- AI Suggestion: ${suggestion.title} ---\n${suggestion.code}`);
  }, [code]);

  // Simple diff view: show lines with +/- markers
  const renderDiffView = () => {
    const oldLines = originalCode.split('\n');
    const newLines = code.split('\n');
    const maxLen = Math.max(oldLines.length, newLines.length);
    return (
      <div className="font-mono text-[11px] leading-relaxed">
        {Array.from({ length: maxLen }).map((_, i) => {
          const oldLine = oldLines[i] ?? '';
          const newLine = newLines[i] ?? '';
          if (oldLine === newLine) {
            return (
              <div key={i} className="px-3 py-0.5 text-zinc-400">
                <span className="text-zinc-600 inline-block w-5 text-right mr-3">{i + 1}</span>
                {newLine}
              </div>
            );
          }
          return (
            <React.Fragment key={i}>
              {oldLine && (
                <div className="px-3 py-0.5 bg-rose-500/5 text-rose-400">
                  <span className="text-rose-600 inline-block w-5 text-right mr-3">-</span>
                  {oldLine}
                </div>
              )}
              {newLine && (
                <div className="px-3 py-0.5 bg-emerald-500/5 text-emerald-400">
                  <span className="text-emerald-600 inline-block w-5 text-right mr-3">+</span>
                  {newLine}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="module-container bg-transparent flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <header className="module-header flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
            <Code2 className="w-6 h-6 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Builder Studio</h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">AI-Assisted</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Code Generation Engine</span>
            </div>
          </div>
        </div>
      </header>

      <main className="module-body flex-1 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 h-full" style={{ minHeight: '600px' }}>

          {/* LEFT: Template Selector */}
          <div className="col-span-12 lg:col-span-3 flex flex-col overflow-hidden bg-zinc-900/40 border border-white/5 rounded-2xl">
            <div className="p-4 border-b border-zinc-800/50">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                Templates
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    !filterCategory ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                      filterCategory === cat ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {filteredTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    selectedTemplate?.id === t.id
                      ? 'bg-violet-500/10 border-violet-500/30'
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{t.icon}</span>
                    <span className="text-[11px] font-bold text-white">{t.name}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>

            {/* History */}
            <div className="border-t border-zinc-800/50 p-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Recent History
              </h4>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                {MOCK_HISTORY.map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                    {h.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-zinc-300 truncate">{h.prompt}</p>
                      <p className="text-[9px] text-zinc-600">{h.timestamp} &middot; {h.linesGenerated} lines</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER: Code Editor */}
          <div className="col-span-12 lg:col-span-6 flex flex-col overflow-hidden bg-zinc-900/40 border border-white/5 rounded-2xl">
            {/* Prompt bar */}
            <div className="p-4 border-b border-zinc-800/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleGenerate(); }}
                    placeholder="Describe what you want to build..."
                    className="w-full bg-zinc-950/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl text-[11px] font-bold text-white transition flex items-center gap-2"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Generate
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition ${
                    showDiff ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <GitBranch className="w-3 h-3" />
                  Diff
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => { setCode(''); setOriginalCode(''); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
                {selectedTemplate && (
                  <span className="text-[10px] text-zinc-600 ml-auto">
                    Template: <span className="text-zinc-400">{selectedTemplate.name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              {generating && (
                <div className="absolute inset-0 z-10 bg-zinc-950/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    <span className="text-[11px] text-zinc-400 font-semibold">Generating code...</span>
                  </div>
                </div>
              )}
              {showDiff && originalCode !== code ? (
                <div className="p-4 overflow-auto h-full">
                  {renderDiffView()}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full bg-transparent text-[12px] text-zinc-300 font-mono leading-relaxed p-4 resize-none focus:outline-none placeholder:text-zinc-700"
                  placeholder="Select a template or start typing code..."
                />
              )}
            </div>

            {/* Footer stats */}
            <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">{code.split('\n').length} lines &middot; {code.length} chars</span>
              <span className="text-[10px] text-zinc-600">TypeScript &middot; UTF-8</span>
            </div>
          </div>

          {/* RIGHT: AI Suggestions */}
          <div className="col-span-12 lg:col-span-3 flex flex-col overflow-hidden bg-zinc-900/40 border border-white/5 rounded-2xl">
            <div className="p-4 border-b border-zinc-800/50">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Suggestions
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Context-aware recommendations</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {MOCK_SUGGESTIONS.map(s => (
                <div key={s.id} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold text-white">{s.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{s.description}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      s.confidence >= 90 ? 'bg-emerald-500/10 text-emerald-400'
                        : s.confidence >= 80 ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {s.confidence}%
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-2 overflow-x-auto">
                    <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap max-h-24 overflow-hidden">
                      {s.code.substring(0, 200)}{s.code.length > 200 ? '...' : ''}
                    </pre>
                  </div>
                  <button
                    onClick={() => handleApplySuggestion(s)}
                    className="w-full py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider hover:bg-violet-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Apply Suggestion
                  </button>
                </div>
              ))}
            </div>

            {/* Quick actions footer */}
            <div className="border-t border-zinc-800/50 p-4 space-y-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPrompt('Add form validation')}
                  className="px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                >
                  + Validation
                </button>
                <button
                  onClick={() => setPrompt('Add loading state')}
                  className="px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                >
                  + Loading
                </button>
                <button
                  onClick={() => setPrompt('Add error handling')}
                  className="px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                >
                  + Errors
                </button>
                <button
                  onClick={() => setPrompt('Add unit tests')}
                  className="px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                >
                  + Tests
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuilderStudio;
