import React, { useState, Suspense } from 'react';
import { User, RoleType } from './types';
import { CURRENT_PROPERTY } from './services/kernel/config';
import { Command, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { migrateInitialOTAChannels } from './services/migrations/seedOTAChannels';
import { agentService } from './services/intelligence/agentService';
import { InspectorProvider } from './context/InspectorContext';
import { PmsProvider, usePms } from './services/kernel/persistence';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme, AppTheme } from './context/ThemeContext';
import { AppearanceProvider } from './src/context/AppearanceContext';
import InspectorShell from './components/shared/InspectorShell';

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unknown runtime error' };
  }

  componentDidCatch(error: Error) {
    console.error('[RootErrorBoundary] Runtime crash:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-zinc-900/80 border border-rose-500/30 rounded-2xl p-6">
            <h1 className="text-lg font-semibold text-rose-400 mb-3">App crashed during render</h1>
            <p className="text-sm text-zinc-300 mb-2">Runtime message:</p>
            <pre className="text-xs bg-black/60 border border-zinc-800 rounded-lg p-3 overflow-auto text-rose-300">
              {this.state.message}
            </pre>
            <p className="text-xs text-zinc-500 mt-4">Open browser DevTools Console for full stack trace.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy Load Apps
const GuestApp = React.lazy(() => import('./components/GuestApp'));
const OpsApp = React.lazy(() => import('./components/OpsApp'));

// ─── Loading Spinner ──────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Debug Overlay (Dev Only) ─────────────────────────────────────────────────

const DebugOverlay = () => {
  const { rooms, loading, seeding, error, clearData } = usePms();
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-black/80 text-white p-4 rounded-lg text-xs font-mono pointer-events-none">
      <div>Status: {loading ? 'Loading...' : 'Ready'}</div>
      <div>Seeding: {seeding ? 'YES' : 'No'}</div>
      <div>Rooms: {rooms.length}</div>
      {error && <div className="text-red-500 font-bold">Error: {error}</div>}
      <button
        onClick={() => { if (confirm('Clear all local data?')) clearData(); }}
        className="mt-2 bg-red-900/50 hover:bg-red-800 text-red-200 px-2 py-1 rounded w-full border border-red-800 pointer-events-auto"
      >
        Wipe Data
      </button>
    </div>
  );
};

// ─── Login Screen ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const { login, loginError, loading } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!employeeId.trim() || !pin.trim()) return;
    setSubmitting(true);
    await login(employeeId.trim(), pin.trim());
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-6 font-sans">

      {/* Dynamic Animated Cosmic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-violet-900/40 rounded-full mix-blend-screen filter blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-900/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="z-10 text-center space-y-8 w-full max-w-md">
        {/* Animated Logo Container */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-violet-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
            <div className="relative p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-2xl flex items-center justify-center animate-pulse" style={{ animationDuration: '4s' }}>
              <Command className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            </div>
          </div>
          <div>
            <h1 className="text-6xl md:text-7xl font-light text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 tracking-tighter drop-shadow-sm">
              SINGULARITY
            </h1>
            <p className="text-violet-300 text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold mt-3 opacity-80 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-violet-500/50"></span>
              Operating System v2.0
              <span className="w-8 h-px bg-violet-500/50"></span>
            </p>
          </div>
        </div>

        {/* Premium Glassmorphic Login Card */}
        <div className="relative bg-black/40 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-2xl w-full overflow-hidden group">

          {/* Subtle inner card glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

          <h2 className="text-zinc-400 mb-8 font-medium text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            Operator Authentication
          </h2>

          <div className="space-y-5 mb-8 relative z-10">
            <div className="group/input">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2 transition-colors group-focus-within/input:text-violet-400">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 rounded-xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition duration-500"></div>
                <input
                  id="employee-id-input"
                  type="text"
                  placeholder="e.g. EMP_001 or your email"
                  value={employeeId}
                  autoComplete="username"
                  onChange={e => setEmployeeId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="relative w-full bg-black/60 border border-zinc-800 rounded-xl p-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-900/80 transition-all duration-300"
                />
              </div>
            </div>

            <div className="group/input">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2 transition-colors group-focus-within/input:text-violet-400">
                Access PIN
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 rounded-xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition duration-500"></div>
                <input
                  id="pin-input"
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  value={pin}
                  autoComplete="current-password"
                  onChange={e => setPin(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="relative w-full bg-black/60 border border-zinc-800 rounded-xl p-4 pr-12 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-900/80 transition-all duration-300 tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors duration-300 z-10"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium animate-pulse backdrop-blur-md flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              {loginError}
            </div>
          )}

          <button
            id="sign-in-button"
            onClick={handleLogin}
            disabled={submitting || loading}
            className="relative w-full group/btn overflow-hidden rounded-xl"
          >
            {/* Button Background & Hover Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-transform duration-500 group-hover/btn:scale-105"></div>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>

            <div className="relative w-full flex justify-center items-center py-4 px-6 text-white font-bold tracking-wide transition-all shadow-lg shadow-violet-900/40">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2">Access System <ShieldCheck className="w-4 h-4" /></div>
              )}
            </div>
          </button>

          <div className="mt-8 p-0 bg-transparent">
            <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium">
              Secured internal system. All access is logged and audited.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400 font-semibold tracking-widest uppercase mt-8">
          <ShieldCheck className="w-3 h-3" />
          Hotel Singularity OS
        </div>
      </div>
    </div>
  );
};

const ThemeSwitcher: React.FC<{ isGuest: boolean }> = ({ isGuest }) => {
  const { theme, setTheme } = useTheme();
  return (
    <div className={`${isGuest ? 'fixed top-4 left-4 md:top-6 md:left-6' : 'fixed bottom-4 right-4 md:bottom-6 md:right-6'} z-[70]`}>
      <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl">
        <label htmlFor="theme-select" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Theme
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as AppTheme)}
          className="bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 outline-none focus:border-violet-500/50"
        >
          <option value="midnight">Midnight</option>
          <option value="ocean">Ocean</option>
          <option value="sandstone">Sandstone</option>
          <option value="aurora">Aurora</option>
          <option value="graphite">Graphite</option>
        </select>
      </div>
    </div>
  );
};

// ─── Main App Shell ───────────────────────────────────────────────────────────

const AppShell: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();

  // Run one-time migrations and AI self-healing repairs on boot
  React.useEffect(() => {
    migrateInitialOTAChannels();
    agentService.seedDefaults();
  }, []);

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <LoginScreen />;

  // Convert internal session to User-compatible object for existing components
  const userAsLegacy: User = {
    principal: currentUser.userId,
    role: currentUser.role,
    fullName: currentUser.fullName,
    hotelId: currentUser.hotelId,
    preferences: {},
    valenceHistory: [],
  };

  const isGuest = currentUser.role === 'Guest';

  return (
    <PmsProvider>
      <DebugOverlay />
      <InspectorProvider>
        <div className="flex flex-col min-h-screen app-container overflow-x-hidden">
          <div className="flex-1 w-full relative h-full flex min-w-0 overflow-hidden">
            {isGuest ? (
              <Suspense fallback={<LoadingScreen />}>
                <GuestApp user={userAsLegacy} room={undefined} reservation={undefined} />
              </Suspense>
            ) : (
              <Suspense fallback={<LoadingScreen />}>
                <OpsApp user={userAsLegacy} property={CURRENT_PROPERTY} />
              </Suspense>
            )}
          </div>

          {/* Sign Out */}
          {isGuest && (
            <button
              id="sign-out-button"
              onClick={logout}
              className="fixed top-4 right-4 md:top-6 md:right-6 z-[60] px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-zinc-800 text-zinc-500 text-xs rounded-full hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition"
            >
              Sign Out
            </button>
          )}
        </div>
        <ThemeSwitcher isGuest={isGuest} />
        <InspectorShell />
      </InspectorProvider>
    </PmsProvider>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <RootErrorBoundary>
    <AppearanceProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </AppearanceProvider>
  </RootErrorBoundary>
);

export default App;
