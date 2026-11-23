import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronUp,
  Code2,
  GraduationCap,
  Lock,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  AppMode,
  AssignmentTask,
  LockUserId,
  RealMadridMatchInfo,
} from '../types/app';
import { DEFAULT_REAL_MADRID_MATCH } from '../data/seedData';
import {
  DEV_STUDIO_PIN,
  buildDynamicSchoolGreeting,
  getTaskUrgency,
} from '../utils/studyAndGrades';
import { UpgradeCollectorButton } from './UpgradeCollector';

interface LaptopLockScreenProps {
  tasks: AssignmentTask[];
  lockSeed: number;
  upgradeIdeasCount: number;
  onUnlockMode: (mode: AppMode) => void;
  onOpenUpgradeCollector: () => void;
}

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Del'];

export const LaptopLockScreen: React.FC<LaptopLockScreenProps> = ({
  tasks,
  lockSeed,
  upgradeIdeasCount,
  onUnlockMode,
  onOpenUpgradeCollector,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [unlockedDrawer, setUnlockedDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LockUserId>('study');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<RealMadridMatchInfo>(
    DEFAULT_REAL_MADRID_MATCH
  );
  const [matchLoading, setMatchLoading] = useState(false);

  const dragStartYRef = useRef<number | null>(null);

  // Live clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Real Madrid Live / Recent Score on mount
  const fetchRealMadridScore = async () => {
    setMatchLoading(true);
    try {
      const res = await fetch('/api/sports/realmadrid');
      if (res.ok) {
        const data = (await res.json()) as RealMadridMatchInfo;
        setMatchInfo(data);
      }
    } catch {
      // keep default cached telemetry
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    fetchRealMadridScore();
  }, []);

  // Reset drawer state when freshly locked
  useEffect(() => {
    setPinInput('');
    setPinError(null);
  }, [lockSeed]);

  const greetingText = useMemo(
    () => buildDynamicSchoolGreeting(tasks, lockSeed, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, lockSeed]
  );

  const overdueCount = useMemo(
    () => tasks.filter((t) => getTaskUrgency(t.dueDate, t.status) === 'overdue').length,
    [tasks]
  );
  const openCount = useMemo(
    () => tasks.filter((t) => t.status !== 'Done').length,
    [tasks]
  );

  const handlePinDigit = (digit: string) => {
    setPinError(null);
    setPinInput((prev) => {
      if (prev.length >= 4) return prev;
      const next = `${prev}${digit}`;
      if (next.length === 4) {
        if (next === '6503') {
          setTimeout(() => onUnlockMode('school'), 80);
        } else if (next === '7026') {
          setTimeout(() => onUnlockMode('inventory'), 80);
        } else if (next === DEV_STUDIO_PIN) {
          setTimeout(() => onUnlockMode('dev'), 80);
        } else {
          setPinError('Incorrect PIN. Please try again.');
        }
      }
      return next;
    });
  };

  // Keyboard listener: typing 1248 anywhere on lock screen unlocks Dev Studio; Space/Enter opens switcher
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        setPinError(null);
        setPinInput((prev) => {
          const base = prev.length >= 4 ? '' : prev;
          const next = `${base}${e.key}`;
          if (next === DEV_STUDIO_PIN) {
            setTimeout(() => onUnlockMode('dev'), 60);
          } else if (next.length === 4 && selectedUser === 'dev') {
            setPinError('Incorrect Dev PIN. Enter 1248 to unlock AI Dev Studio.');
          }
          return next;
        });
        return;
      }

      if (e.key === 'Backspace') {
        setPinInput((prev) => prev.slice(0, -1));
        setPinError(null);
        return;
      }

      if ((e.key === ' ' || e.key === 'Enter') && !unlockedDrawer) {
        e.preventDefault();
        setUnlockedDrawer(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUnlockMode, selectedUser, unlockedDrawer]);

  const timeString = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateString = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartYRef.current === null) return;
    const deltaY = dragStartYRef.current - e.clientY;
    dragStartYRef.current = null;
    if (deltaY > 40) {
      setUnlockedDrawer(true);
    }
  };

  return (
    <div
      role="main"
      aria-label="Study Sole Laptop Lock Screen"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative min-h-screen w-full flex flex-col justify-between bg-[#030611] text-white overflow-y-auto select-none"
    >
      {/* Laptop Lock Screen Atmospheric Wallpaper Gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_22%_18%,rgba(59,130,246,0.28),transparent_48%),radial-gradient(ellipse_at_78%_22%,rgba(245,158,11,0.18),transparent_44%),radial-gradient(ellipse_at_55%_88%,rgba(16,185,129,0.2),transparent_52%)]"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 hud-cyber-grid opacity-70" />

      {/* Top Bar: Branding Badge + Persistent Top-Right "!" Upgrade Collector */}
      <header className="relative z-10 h-16 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/images/logo_study_sole_1795360360333.jpg"
            alt="Study Sole v2.0 logo"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover border border-cyan-400/45"
          />
          <span className="font-display font-bold text-sm text-white tracking-tight">
            Study Sole v2.0
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-nums font-bold tracking-wider bg-indigo-500/20 text-cyan-200 border border-cyan-400/35">
            v3.0 Coming Soon...
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono-nums text-slate-300 bg-white/5 border border-white/10">
            <Lock className="w-3 h-3 text-cyan-300" aria-hidden="true" />
            <span>Press Esc anytime to lock</span>
          </span>
          <UpgradeCollectorButton
            ideasCount={upgradeIdeasCount}
            onOpen={onOpenUpgradeCollector}
          />
        </div>
      </header>

      {/* Main Laptop Lock Screen Stage */}
      <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col items-center justify-center gap-6">
        {/* Live Laptop Clock + Date + Welcome Banner */}
        <div className="text-center space-y-2.5">
          <div
            data-testid="lock-clock"
            className="font-display font-extrabold text-6xl sm:text-7xl tracking-tight text-white drop-shadow-[0_6px_30px_rgba(59,130,246,0.3)]"
          >
            {timeString}
          </div>
          <div className="text-sm sm:text-base font-medium text-cyan-200/90 tracking-wide">
            {dateString}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-display font-bold text-white shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Welcome Ghirmay to Study Sole v2.0</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/25 to-cyan-500/25 border border-cyan-400/40 text-[11px] font-mono-nums font-semibold text-cyan-200">
              v3.0 Coming Soon...
            </span>
          </div>
        </div>

        {/* Lock Screen Widgets Row: Dynamic Schoolwork Greeting + Real Madrid Live/Recent Score */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dynamic Canvas Schoolwork Greeting Card */}
          <section
            aria-label="Dynamic Schoolwork Greeting"
            data-testid="lock-school-greeting"
            className="rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-indigo-400/35 p-5 flex flex-col justify-between gap-3 shadow-[0_16px_50px_rgba(37,99,235,0.16)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-nums font-bold uppercase tracking-wider text-cyan-300">
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Canvas Deadline Pulse</span>
              </span>
              <span className="font-mono-nums text-[11px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-200 border border-blue-400/30">
                {openCount} open{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
              </span>
            </div>

            <p className="font-display font-semibold text-base sm:text-lg text-white leading-snug">
              {greetingText}
            </p>
          </section>

          {/* Real Madrid Live / Recent Score Widget */}
          <section
            aria-label="Real Madrid Score Widget"
            data-testid="real-madrid-widget"
            className="rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-amber-400/35 p-5 flex flex-col justify-between gap-3 shadow-[0_16px_50px_rgba(245,158,11,0.14)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 via-white to-indigo-500 flex items-center justify-center text-slate-950">
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-mono-nums font-bold uppercase tracking-wider text-amber-300">
                  Real Madrid · {matchInfo.competition}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono-nums text-[11px] px-2 py-0.5 rounded-md border ${
                    matchInfo.isLive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/45 animate-pulse'
                      : 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                  }`}
                >
                  {matchInfo.statusLabel}
                </span>
                <button
                  type="button"
                  onClick={fetchRealMadridScore}
                  disabled={matchLoading}
                  aria-label="Refresh Real Madrid score"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${matchLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/75 border border-white/10 px-4 py-2.5">
              <div className="min-w-0 flex-1 text-left">
                <div className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {matchInfo.homeTeam}
                </div>
                <div className="text-[11px] text-slate-400">{matchInfo.matchDateLabel}</div>
              </div>

              <div className="font-mono-nums text-xl sm:text-2xl font-extrabold text-amber-300 px-3 py-1 rounded-lg bg-slate-950/90 border border-amber-400/30 shrink-0">
                {matchInfo.homeScore !== null && matchInfo.awayScore !== null
                  ? `${matchInfo.homeScore} - ${matchInfo.awayScore}`
                  : 'VS'}
              </div>

              <div className="min-w-0 flex-1 text-right">
                <div className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {matchInfo.awayTeam}
                </div>
                <div className="text-[11px] text-slate-400">Hala Madrid</div>
              </div>
            </div>
          </section>
        </div>

        {/* Swipe-Up Trigger OR Expanded Multi-User Switcher & PIN Pad */}
        {!unlockedDrawer ? (
          <div className="pt-2 flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setUnlockedDrawer(true)}
              data-testid="swipe-unlock-btn"
              className="group flex flex-col items-center gap-1.5 px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-cyan-300/60 transition-all shadow-xl"
            >
              <ChevronUp
                className="w-5 h-5 text-cyan-300 animate-bounce"
                aria-hidden="true"
              />
              <span className="font-display font-bold text-sm text-white">
                Swipe up or click to unlock
              </span>
              <span className="text-[11px] font-mono-nums text-slate-300">
                Choose Study, Sole, or enter Dev PIN 1248
              </span>
            </button>

            {/* Quick 3-User Switcher Bar directly accessible */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onUnlockMode('school')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold bg-blue-600/25 hover:bg-blue-600/40 text-blue-100 border border-blue-400/40 transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                <span>User 1: Study</span>
              </button>
              <button
                type="button"
                onClick={() => onUnlockMode('inventory')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-100 border border-emerald-400/40 transition-all"
              >
                <Package className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <span>User 2: Sole</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser('dev');
                  setUnlockedDrawer(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-100 border border-amber-400/40 transition-all"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                <span>User 3: Dev (PIN)</span>
              </button>
            </div>
          </div>
        ) : (
          <section
            aria-label="Multi-User Switcher and Dev PIN Unlock"
            className="w-full max-w-3xl rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)] grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
          >
            {/* Left: 3 User Switcher Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-nums font-bold uppercase tracking-wider text-cyan-300">
                  Switch User Profile
                </span>
                <button
                  type="button"
                  onClick={() => setUnlockedDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back to Cover
                </button>
              </div>

              <button
                type="button"
                onClick={() => onUnlockMode('school')}
                className="w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/15 hover:from-blue-600/35 hover:to-indigo-600/25 border border-blue-400/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/25 border border-blue-400/40 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white">
                      User 1 · Study
                    </div>
                    <div className="text-xs text-slate-300">
                      Opens directly into School Mode
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-cyan-300">Enter →</span>
              </button>

              <button
                type="button"
                onClick={() => onUnlockMode('inventory')}
                className="w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/15 hover:from-emerald-600/35 hover:to-cyan-600/25 border border-emerald-400/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white">
                      User 2 · Sole
                    </div>
                    <div className="text-xs text-slate-300">
                      Opens directly into Sneaker Vault
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-300">Enter →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUser('dev');
                  setPinInput('');
                  setPinError(null);
                }}
                className={`w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                  selectedUser === 'dev'
                    ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/20 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 hover:bg-white/10 border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-400/45 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-amber-300" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white">
                      User 3 · Dev Studio
                    </div>
                    <div className="text-xs text-amber-200/90">
                      Enter security PIN on keypad to unlock
                    </div>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-amber-300" aria-hidden="true" />
              </button>
            </div>

            {/* Right: PIN Pad for Security Gate */}
            <div className="rounded-2xl bg-slate-900/75 border border-white/10 p-4 space-y-3">
              <div className="text-center">
                <div className="text-xs font-mono-nums font-bold uppercase tracking-wider text-amber-300">
                  Secure Access PIN Gate
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Type 4-digit PIN via keyboard or keypad
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 py-1">
                {[0, 1, 2, 3].map((slot) => {
                  const filled = slot < pinInput.length;
                  return (
                    <div
                      key={slot}
                      className={`w-10 h-11 rounded-xl border flex items-center justify-center font-mono-nums text-lg font-bold transition-all ${
                        filled
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-950/90 border-white/15 text-slate-600'
                      }`}
                    >
                      {filled ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              {pinError && (
                <div
                  role="alert"
                  className="rounded-lg bg-rose-500/15 border border-rose-400/40 px-3 py-1.5 text-[11px] text-rose-200 text-center"
                >
                  {pinError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {KEYPAD_KEYS.map((key) => {
                  if (key === 'Clear') {
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setPinInput('');
                          setPinError(null);
                        }}
                        className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 border border-white/10"
                      >
                        Clear
                      </button>
                    );
                  }
                  if (key === 'Del') {
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label="Delete digit"
                        onClick={() => {
                          setPinInput((p) => p.slice(0, -1));
                          setPinError(null);
                        }}
                        className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePinDigit(key)}
                      className="h-10 rounded-xl bg-slate-950/80 hover:bg-amber-400/20 text-base font-mono-nums font-bold text-white border border-white/10 hover:border-amber-400/50 transition-all"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="relative z-10 px-6 py-3 text-center text-[11px] font-mono-nums text-slate-400">
        Study Sole v2.0 · Ghirmay Personal Command Center · Typing 1248 opens Dev Studio
      </footer>
    </div>
  );
};
