import React, { useMemo, useState } from 'react';
import {
  Building2,
  CloudRain,
  Sun,
  Moon,
  Sparkles,
  Hammer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Info,
  Swords,
} from 'lucide-react';
import {
  AssignmentTask,
  CityLandmarkId,
  FocusAudioTrack,
  StudyCityState,
} from '../types/app';
import {
  CITY_BUILDING_MILESTONES,
  getCityEnvironment,
  getNextCityTierProgress,
} from '../utils/cityAndQuests';
import { AnimatedNumber } from './AnimatedNumber';
import { FocusAudioBar } from './FocusAudioBar';

interface StudyCitySkylineProps {
  city: StudyCityState;
  tasks: AssignmentTask[];
  timerSecondsLeft: number;
  timerTotalSeconds: number;
  timerRunning: boolean;
  timerMode: 'focus' | 'break';
  audioTrack: FocusAudioTrack;
  audioMuted: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSwitchTimerMode: (mode: 'focus' | 'break') => void;
  onCompleteFocusBlock: () => void;
  onSelectAudioTrack: (track: FocusAudioTrack) => void;
  onToggleMute: () => void;
  onLaunchBossBattle: () => void;
}

export const StudyCitySkyline: React.FC<StudyCitySkylineProps> = ({
  city,
  tasks,
  timerSecondsLeft,
  timerTotalSeconds,
  timerRunning,
  timerMode,
  audioTrack,
  audioMuted,
  onToggleTimer,
  onResetTimer,
  onSwitchTimerMode,
  onCompleteFocusBlock,
  onSelectAudioTrack,
  onToggleMute,
  onLaunchBossBattle,
}) => {
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<CityLandmarkId | null>(null);

  const env = useMemo(() => getCityEnvironment(tasks), [tasks]);
  const tierProgress = useMemo(
    () => getNextCityTierProgress(city.blueprints),
    [city.blueprints]
  );

  const { currentTier, nextTier, progressPercent, blueprintsToNext } = tierProgress;
  const totalHours = (city.totalStudyMinutes / 60).toFixed(1);
  const constructionActive = timerRunning && timerMode === 'focus';
  const focusProgressPct =
    timerTotalSeconds > 0
      ? Math.min(100, Math.round(((timerTotalSeconds - timerSecondsLeft) / timerTotalSeconds) * 100))
      : 0;

  const mins = String(Math.floor(timerSecondsLeft / 60)).padStart(2, '0');
  const secs = String(timerSecondsLeft % 60).padStart(2, '0');

  const selectedMilestone = selectedLandmarkId
    ? CITY_BUILDING_MILESTONES.find((b) => b.id === selectedLandmarkId) || null
    : null;
  const selectedUnlocked = selectedLandmarkId
    ? city.unlockedLandmarks.includes(selectedLandmarkId)
    : false;

  // Dynamic sky colors based on time of day & weather
  const skyStops = useMemo(() => {
    if (env.weather === 'rain') {
      if (env.skyPhase === 'night') {
        return { top: '#070b18', mid: '#121b33', bottom: '#1e293b' };
      }
      return { top: '#1e293b', mid: '#334155', bottom: '#475569' };
    }
    if (env.skyPhase === 'morning') {
      return { top: '#0c4a6e', mid: '#0284c7', bottom: '#fb923c' };
    }
    if (env.skyPhase === 'sunset') {
      return { top: '#1e1b4b', mid: '#7c2d12', bottom: '#f59e0b' };
    }
    if (env.skyPhase === 'night') {
      return { top: '#020617', mid: '#0f172a', bottom: '#1e1b4b' };
    }
    return { top: '#0369a1', mid: '#0ea5e9', bottom: '#38bdf8' };
  }, [env.skyPhase, env.weather]);

  const winColor = env.windowsLit ? '#fde047' : 'rgba(186,230,253,0.72)';
  const neonCyan = env.windowsLit ? '#22d3ee' : '#38bdf8';

  return (
    <section
      aria-label="Focumon-Style Evolving Study City Skyline"
      data-testid="study-city-panel"
      className="hud-corners hud-indigo rounded-2xl bg-slate-900/65 backdrop-blur-md border border-indigo-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_40px_rgba(37,99,235,0.16)] p-4 sm:p-5 space-y-4"
    >
      {/* Top City Telemetry Strip: Mayor Rank, Population, Total Study Hours, Bricks & Blueprints */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            <h2 className="font-display font-bold text-lg text-white">
              Study City · Lv. {city.level} {currentTier.title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mt-1">
            <span>
              Mayor Rank: <strong className="text-amber-300">{currentTier.mayorRank}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono-nums">
              Population:{' '}
              <strong className="text-cyan-300">
                <AnimatedNumber value={currentTier.population} formatLocale />
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono-nums">
              Study Time: <strong className="text-indigo-200">{totalHours} hrs</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl bg-slate-950/80 border border-amber-400/35 px-3 py-1.5 text-xs font-mono-nums">
            <span className="text-slate-400">Bricks: </span>
            <strong className="text-amber-300" data-testid="city-bricks-value">
              <AnimatedNumber value={city.bricks} formatLocale />
            </strong>
          </div>
          <div className="rounded-xl bg-slate-950/80 border border-cyan-400/35 px-3 py-1.5 text-xs font-mono-nums">
            <span className="text-slate-400">Blueprints (XP): </span>
            <strong className="text-cyan-300" data-testid="city-blueprints-value">
              <AnimatedNumber value={city.blueprints} formatLocale />
            </strong>
          </div>
        </div>
      </div>

      {/* Weather & Evolution Progress Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-white/10 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          {env.weather === 'sunny' ? (
            <Sun className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
          ) : (
            <CloudRain className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
          )}
          <span
            data-testid="city-weather-status"
            className={`font-semibold ${
              env.weather === 'sunny' ? 'text-amber-200' : 'text-sky-200'
            }`}
          >
            {env.weatherLabel}
          </span>
          <span className="text-slate-500" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            {env.windowsLit && <Moon className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />}
            <span>{env.skyLabel}</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 min-w-[210px] flex-1 sm:flex-initial">
          <div className="flex-1 sm:w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono-nums text-[11px] text-cyan-200 whitespace-nowrap">
            {nextTier ? `${blueprintsToNext} BP to Lv.${nextTier.level}` : 'Max City Tier!'}
          </span>
        </div>
      </div>

      {/* Interactive City Skyline SVG Viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-inner bg-slate-950">
        <svg
          viewBox="0 0 920 290"
          className="w-full h-56 sm:h-64 block select-none"
          role="img"
          aria-label={`Interactive Study City Skyline Level ${city.level}`}
        >
          <defs>
            <linearGradient id="citySkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={skyStops.top} />
              <stop offset="55%" stopColor={skyStops.mid} />
              <stop offset="100%" stopColor={skyStops.bottom} />
            </linearGradient>
            <linearGradient id="stadiumGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(56,189,248,0.45)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0)" />
            </linearGradient>
          </defs>

          {/* Dynamic Sky */}
          <rect x="0" y="0" width="920" height="290" fill="url(#citySkyGrad)" />

          {/* Stars / Sun / Moon */}
          {env.skyPhase === 'night' && env.weather === 'sunny' && (
            <g fill="#e2e8f0" opacity="0.8">
              <circle cx="85" cy="36" r="1.4" />
              <circle cx="195" cy="54" r="1.2" />
              <circle cx="310" cy="28" r="1.6" />
              <circle cx="485" cy="44" r="1.3" />
              <circle cx="660" cy="30" r="1.5" />
              <circle cx="790" cy="52" r="1.2" />
              <circle cx="855" cy="32" r="1.7" />
              <circle cx="820" cy="58" r="16" fill="#fef08a" opacity="0.92" />
            </g>
          )}
          {env.weather === 'sunny' && env.skyPhase !== 'night' && (
            <g>
              <circle cx="815" cy="60" r="24" fill="#fde047" opacity="0.95" />
              <circle cx="815" cy="60" r="36" fill="#fde047" opacity="0.22" />
            </g>
          )}

          {/* Rain Clouds & Raindrops when Overdue Tasks > 0 */}
          {env.weather === 'rain' && (
            <g data-testid="city-rain-layer">
              <g fill="#475569" opacity="0.92">
                <ellipse cx="180" cy="52" rx="68" ry="22" />
                <ellipse cx="225" cy="44" rx="46" ry="20" />
                <ellipse cx="470" cy="48" rx="82" ry="24" />
                <ellipse cx="520" cy="40" rx="50" ry="20" />
                <ellipse cx="760" cy="54" rx="74" ry="22" />
              </g>
              <g stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" opacity="0.65">
                {[90, 140, 210, 270, 360, 430, 500, 570, 650, 720, 790, 860].map((rx, idx) => (
                  <line
                    key={rx}
                    x1={rx}
                    y1={76 + (idx % 3) * 18}
                    x2={rx - 10}
                    y2={106 + (idx % 3) * 18}
                    className="city-rain-drop"
                  />
                ))}
              </g>
            </g>
          )}

          {/* Distant Horizon Silhouette */}
          <path
            d="M0 245 L0 212 L80 212 L80 194 L160 194 L160 222 L280 222 L280 185 L390 185 L390 216 L540 216 L540 198 L690 198 L690 220 L820 220 L820 196 L920 196 L920 245 Z"
            fill="rgba(15, 23, 42, 0.36)"
          />

          {/* Ground / Dirt Road (Lv. 1) vs Paved Boulevard (Lv. 2+) */}
          <rect
            x="0"
            y="240"
            width="920"
            height="50"
            fill={city.level === 1 ? '#5c4033' : '#1e293b'}
          />
          <rect
            x="0"
            y="256"
            width="920"
            height="14"
            fill={city.level === 1 ? '#785544' : '#0f172a'}
          />
          {city.level >= 2 && (
            <line
              x1="0"
              y1="263"
              x2="920"
              y2="263"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="16 14"
              opacity="0.7"
            />
          )}

          {/* LV. 1: Small Cabin & Trees (Always Present & Clickable) */}
          <g
            data-testid="city-building-cabin"
            role="button"
            aria-label="Inspect Lv.1 Small Cabin milestone"
            onClick={() => setSelectedLandmarkId('cabin')}
            className="cursor-pointer hover:opacity-95 transition-opacity"
          >
            <title>Lv. 1 · Small Cabin &amp; Dirt Roads (Click for milestone)</title>
            {/* Pine trees */}
            <polygon points="36,240 50,204 64,240" fill="#14532d" />
            <polygon points="56,240 68,210 80,240" fill="#166534" />
            {/* Cabin */}
            <rect x="86" y="198" width="74" height="42" rx="2" fill="#7c2d12" stroke="#451a03" />
            <polygon points="78,200 123,170 168,200" fill="#9a3412" stroke="#451a03" />
            <rect x="115" y="216" width="16" height="24" fill="#451a03" />
            <rect x="95" y="210" width="13" height="12" rx="1" fill={winColor} />
            <rect x="138" y="210" width="13" height="12" rx="1" fill={winColor} />
          </g>

          {/* LV. 2: Townhouses & Study Café */}
          {city.level >= 2 ? (
            <g
              data-testid="city-building-cafe"
              role="button"
              aria-label="Inspect Lv.2 Townhouses and Study Café milestone"
              onClick={() => setSelectedLandmarkId('cafe')}
              className="cursor-pointer hover:opacity-95 transition-opacity"
            >
              <title>Lv. 2 · Townhouses &amp; Study Café (Click for milestone)</title>
              <rect x="182" y="168" width="60" height="72" fill="#991b1b" stroke="#450a0a" />
              <rect x="190" y="180" width="12" height="14" fill={winColor} />
              <rect x="220" y="180" width="12" height="14" fill={winColor} />
              <rect x="190" y="204" width="12" height="14" fill={winColor} />
              {/* Study Cafe */}
              <rect x="246" y="178" width="84" height="62" fill="#1e293b" stroke="#334155" />
              <polygon points="242,196 334,196 328,207 248,207" fill="#d97706" />
              <rect x="260" y="212" width="38" height="28" fill={winColor} opacity="0.88" />
              <text x="288" y="191" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="bold">
                CAFÉ
              </text>
            </g>
          ) : (
            <g
              data-testid="city-building-cafe"
              role="button"
              aria-label="Inspect Lv.2 Townhouses and Study Café milestone"
              onClick={() => setSelectedLandmarkId('cafe')}
              className="cursor-pointer opacity-35"
            >
              <rect
                x="194"
                y="186"
                width="124"
                height="54"
                fill="none"
                stroke="#94a3b8"
                strokeDasharray="5 4"
              />
              <text x="256" y="217" textAnchor="middle" fill="#cbd5e1" fontSize="10">
                Lv.2 Café Lot
              </text>
            </g>
          )}

          {/* LV. 3: High-Rise Apartments & Tech Library */}
          {city.level >= 3 ? (
            <g
              onClick={() => setSelectedLandmarkId('library')}
              className="cursor-pointer hover:opacity-95 transition-opacity"
            >
              <title>Lv. 3 · High-Rise Apartments &amp; Tech Library (Click for milestone)</title>
              {/* High-rise Apartment */}
              <rect x="348" y="108" width="66" height="132" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              {[120, 140, 160, 180, 200].map((wy) => (
                <g key={wy} fill={winColor}>
                  <rect x="358" y={wy} width="12" height="10" rx="1" />
                  <rect x="376" y={wy} width="12" height="10" rx="1" />
                  <rect x="394" y={wy} width="12" height="10" rx="1" />
                </g>
              ))}
              {/* Tech Library */}
              <rect x="422" y="142" width="96" height="98" rx="3" fill="#1e1b4b" stroke="#818cf8" />
              <rect x="434" y="156" width="72" height="40" rx="2" fill={neonCyan} opacity="0.28" />
              <text x="470" y="180" textAnchor="middle" fill="#e0e7ff" fontSize="10" fontWeight="bold">
                TECH LIBRARY
              </text>
            </g>
          ) : (
            <g onClick={() => setSelectedLandmarkId('library')} className="cursor-pointer opacity-35">
              <rect
                x="354"
                y="160"
                width="156"
                height="80"
                fill="none"
                stroke="#94a3b8"
                strokeDasharray="5 4"
              />
              <text x="432" y="204" textAnchor="middle" fill="#cbd5e1" fontSize="10">
                Lv.3 Library Lot
              </text>
            </g>
          )}

          {/* LV. 4: Neon Skyscrapers & Sneaker Flagship Store */}
          {city.level >= 4 ? (
            <g
              onClick={() => setSelectedLandmarkId('sneaker-store')}
              className="cursor-pointer hover:opacity-95 transition-opacity"
            >
              <title>Lv. 4 · Neon Skyscrapers &amp; Sneaker Flagship Store (Click for milestone)</title>
              {/* Neon Skyscraper */}
              <rect x="534" y="72" width="64" height="168" fill="#090d16" stroke={neonCyan} strokeWidth="1.4" />
              <line x1="566" y1="50" x2="566" y2="72" stroke={neonCyan} strokeWidth="2" />
              <circle cx="566" cy="48" r="3" fill="#22d3ee" />
              {[88, 108, 128, 148, 168, 188, 208].map((wy) => (
                <g key={wy} fill={wy % 40 === 8 ? neonCyan : winColor}>
                  <rect x="544" y={wy} width="18" height="8" rx="1" />
                  <rect x="570" y={wy} width="18" height="8" rx="1" />
                </g>
              ))}
              {/* Sneaker Flagship Store */}
              <rect x="606" y="156" width="92" height="84" rx="4" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
              <rect x="616" y="168" width="72" height="18" rx="3" fill="#10b981" opacity="0.25" />
              <text x="652" y="180" textAnchor="middle" fill="#6ee7b7" fontSize="9.5" fontWeight="bold">
                SOLE FLAGSHIP
              </text>
              <rect x="622" y="196" width="60" height="32" rx="2" fill="#022c22" stroke="#34d399" />
            </g>
          ) : (
            <g onClick={() => setSelectedLandmarkId('sneaker-store')} className="cursor-pointer opacity-35">
              <rect
                x="540"
                y="148"
                width="148"
                height="92"
                fill="none"
                stroke="#94a3b8"
                strokeDasharray="5 4"
              />
              <text x="614" y="198" textAnchor="middle" fill="#cbd5e1" fontSize="10">
                Lv.4 Sneaker Store Lot
              </text>
            </g>
          )}

          {/* LV. 5: Championship Soccer Stadium & Futuristic Megacity */}
          {city.level >= 5 ? (
            <g
              onClick={() => setSelectedLandmarkId('stadium')}
              className="cursor-pointer hover:opacity-95 transition-opacity"
            >
              <title>Lv. 5 · Championship Soccer Stadium &amp; Megacity (Click for milestone)</title>
              {/* Megacity Spire */}
              <rect x="842" y="64" width="54" height="176" fill="#0f172a" stroke="#a855f7" strokeWidth="1.4" />
              <polygon points="842,64 869,34 896,64" fill="#3b0764" stroke="#c084fc" />
              {/* Floodlight beams */}
              <polygon points="732,126 706,178 760,178" fill="url(#stadiumGlow)" />
              <polygon points="818,126 792,178 844,178" fill="url(#stadiumGlow)" />
              {/* Stadium Bowl */}
              <path
                d="M708 240 L718 176 L832 176 L842 240 Z"
                fill="#1e293b"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <ellipse cx="775" cy="176" rx="57" ry="12" fill="#0284c7" stroke="#7dd3fc" />
              <text x="775" y="214" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="bold">
                STADIUM
              </text>
            </g>
          ) : (
            <g onClick={() => setSelectedLandmarkId('stadium')} className="cursor-pointer opacity-35">
              <rect
                x="714"
                y="162"
                width="174"
                height="78"
                fill="none"
                stroke="#94a3b8"
                strokeDasharray="5 4"
              />
              <text x="801" y="205" textAnchor="middle" fill="#cbd5e1" fontSize="10">
                Lv.5 Stadium Lot
              </text>
            </g>
          )}

          {/* Championship Trophy Monument (Unlocked when defeating Exam Boss) */}
          {city.championshipTrophyUnlocked && (
            <g
              onClick={() => setSelectedLandmarkId('trophy-monument')}
              data-testid="city-trophy-monument"
              className="cursor-pointer"
            >
              <title>Championship Trophy Monument (Unlocked by Boss Battle Victory!)</title>
              <circle cx="470" cy="108" r="24" fill="#fbbf24" opacity="0.22" />
              <rect x="461" y="124" width="18" height="18" fill="#d97706" stroke="#fde68a" />
              <path
                d="M458 98 H482 L477 116 H463 Z"
                fill="#fbbf24"
                stroke="#fef08a"
                strokeWidth="1.2"
              />
              <rect x="467" y="116" width="6" height="8" fill="#f59e0b" />
            </g>
          )}

          {/* Active Construction Crane & Welding Sparks when Focus Timer Running */}
          {constructionActive && (
            <g data-testid="active-construction-crane">
              <rect x="676" y="84" width="6" height="156" fill="#f59e0b" />
              <g className="crane-arm-sway" style={{ transformOrigin: '679px 88px' }}>
                <rect x="615" y="84" width="118" height="5" fill="#fbbf24" />
                <line x1="636" y1="89" x2="636" y2="142" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="626" y="142" width="20" height="12" rx="2" fill="#22d3ee" />
                <circle cx="636" cy="148" r="3" fill="#fef08a" className="animate-ping" />
              </g>
            </g>
          )}
        </svg>

        {/* Active Construction Progress Overlay */}
        {constructionActive && (
          <div className="bg-amber-500/15 border-t border-amber-400/40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-200 font-semibold">
              <Hammer className="w-4 h-4 text-amber-300 animate-bounce" aria-hidden="true" />
              <span>Active Construction Mode: Building next city upgrade...</span>
            </div>
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <div className="w-32 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${focusProgressPct}%` }}
                />
              </div>
              <span className="font-mono-nums text-amber-200">{focusProgressPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Building Milestone Inspector */}
      {selectedMilestone ? (
        <div
          data-testid="building-milestone-card"
          className="rounded-xl bg-slate-950/80 border border-cyan-400/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5">
            {selectedMilestone.isSpecial ? (
              <Trophy className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div>
              <div className="font-display font-bold text-sm text-white">
                {selectedMilestone.name}{' '}
                <span className={selectedUnlocked ? 'text-emerald-300' : 'text-amber-300'}>
                  ({selectedUnlocked ? 'Unlocked' : 'Locked'})
                </span>
              </div>
              <p className="text-slate-300 mt-0.5">
                Milestone: <strong>{selectedMilestone.unlockCondition}</strong> ·{' '}
                {selectedMilestone.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLandmarkId(null)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">
          Tip: Click any building in the skyline above to inspect its unlock milestone. Complete focus blocks to build!
        </p>
      )}

      {/* Docked City Construction Timer & Built-In Focus Audio Bar */}
      <div className="rounded-xl bg-slate-950/75 border border-indigo-400/25 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-mono-nums text-2xl sm:text-3xl font-bold text-blue-200 telemetry-glow-blue">
              {mins}:{secs}
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-white/10">
              <button
                type="button"
                onClick={() => onSwitchTimerMode('focus')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                  timerMode === 'focus'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Focus 25m
              </button>
              <button
                type="button"
                onClick={() => onSwitchTimerMode('break')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                  timerMode === 'break'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Break 5m
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleTimer}
              data-testid="city-timer-toggle"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              {timerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Start Construction</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              title="Halt construction & reset timer (awards 0 XP)"
              aria-label="Reset focus timer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {timerMode === 'focus' && (
              <button
                type="button"
                onClick={onCompleteFocusBlock}
                data-testid="city-complete-focus-btn"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Complete Block (+75 Bricks / +50 XP)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLaunchBossBattle}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-indigo-500/25 hover:brightness-125 text-amber-200 border border-amber-400/50 shadow-[0_0_16px_rgba(251,191,36,0.2)] transition-all"
            >
              <Swords className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Start Boss Battle</span>
            </button>
          </div>
        </div>

        <FocusAudioBar
          activeTrack={audioTrack}
          muted={audioMuted}
          onSelectTrack={onSelectAudioTrack}
          onToggleMute={onToggleMute}
        />
      </div>
    </section>
  );
};
