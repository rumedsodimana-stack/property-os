
import React, { useState } from 'react';
import { oracleService } from '../../services/intelligence/oracleService';
import { OracleContext, OracleAnalysisResponse } from '../../types';
import { Circle, Send, Terminal, AlertTriangle, CheckCircle, X, ShieldAlert, Cpu } from 'lucide-react';

interface OracleWidgetProps {
  context: OracleContext;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const OracleWidget: React.FC<OracleWidgetProps> = ({ context, className = '', size = 'sm' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [response, setResponse] = useState<OracleAnalysisResponse | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsThinking(true);
    const res = await oracleService.analyzePrompt(context, prompt);
    setResponse(res);
    setIsThinking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleApply = () => {
    if (response) {
      oracleService.applyChanges(response.proposedChanges);
      setIsOpen(false);
      setResponse(null);
      setPrompt('');
      // Optional: Trigger a toast or global refresh here
    }
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const containerSize = size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <>
      {/* Trigger Icon */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className={`group relative flex items-center justify-center rounded-full bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 hover:border-red-500 transition-all cursor-pointer ${containerSize} ${className}`}
        title="Invoke Oracle AI Configuration"
      >
        <div className={`absolute inset-0 bg-red-500/20 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition`}></div>
        <Circle className={`${iconSize} text-red-700 group-hover:text-red-400`} strokeWidth={3} />
      </button>

      {/* Oracle Interface Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-lg bg-zinc-950 border border-red-900/30 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900"></div>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Oracle AI Backend</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-xs font-mono text-zinc-500 bg-zinc-900 p-2 rounded border border-zinc-800">
                <span className="text-red-500 font-bold">CONTEXT:</span> {context.moduleId} {context.fieldId ? `> ${context.fieldId}` : ''}
              </div>

              {!response ? (
                <div className="space-y-4">
                  <textarea
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 focus:border-red-500/50 focus:outline-none resize-none h-32 placeholder-zinc-600"
                    placeholder="Describe the system change..."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={isThinking || !prompt}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                    >
                      {isThinking ? <Terminal className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Analyze & Generate Patch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-slideUp">
                  {/* Analysis Result */}
                  <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase">
                      <Terminal className="w-3 h-3" /> Analysis
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{response.analysis}</p>

                    <div className="flex gap-4 pt-2">
                      <div className="bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 text-xs">
                        <span className="text-zinc-500 block text-[10px] uppercase">Risk Level</span>
                        <span className={`font-bold ${response.riskLevel === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{response.riskLevel}</span>
                      </div>
                      <div className="bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 text-xs">
                        <span className="text-zinc-500 block text-[10px] uppercase">Affected Modules</span>
                        <span className="text-zinc-300">{response.affectedModules.length > 0 ? response.affectedModules.join(', ') : 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostics Preview */}
                  <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-900/30 p-2 rounded border border-zinc-800/50">
                    <ShieldAlert className="w-3 h-3 mt-0.5" />
                    <span>Diagnostics: {response.diagnostics}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setResponse(null)}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition"
                    >
                      Cancel / Modify
                    </button>
                    <button
                      onClick={handleApply}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <CheckCircle className="w-3 h-3" /> Apply Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OracleWidget;
