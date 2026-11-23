import React, { useMemo, useState } from 'react';
import {
  Brain,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  GraduationCap,
  Loader2,
  Lock,
  Package,
  Play,
  Rocket,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  AppMode,
  AppliedDevPatch,
  DevAiMode,
  SoleThemeColor,
  UpgradeIdeaItem,
} from '../types/app';
import { compileMegaUpgradePrompt } from '../utils/studyAndGrades';
import { SOLE_THEME_OPTIONS, STUDY_THEME_PRESETS } from '../utils/themeUtils';
import { UpgradeCollectorButton } from './UpgradeCollector';

interface DevStudioResponse {
  title: string;
  targetArea: string;
  planSummary: string;
  implementationSteps: string[];
  codeSnippet: string;
  livePatch?: {
    studyThemeColor?: string;
    soleThemeColor?: string;
    monthlyProfitGoal?: number;
    studioAnnouncement?: string;
    newTaskTitle?: string;
  };
}

interface DevStudioViewProps {
  upgradeIdeas: UpgradeIdeaItem[];
  appliedPatches: AppliedDevPatch[];
  studyThemeColor: string;
  soleThemeColor: SoleThemeColor;
  monthlyProfitGoal: number;
  studioAnnouncement: string;
  tasksCount: number;
  sneakersCount: number;
  onDeleteIdea: (id: string) => void;
  onClearIdeas: () => void;
  onApplyLivePatch: (patch: {
    title: string;
    aiMode: DevAiMode;
    targetArea: string;
    studyThemeColor?: string;
    soleThemeColor?: SoleThemeColor;
    monthlyProfitGoal?: number;
    studioAnnouncement?: string;
    newTaskTitle?: string;
  }) => void;
  onNavigateMode: (mode: AppMode) => void;
  onLockApp: () => void;
  onOpenUpgradeCollector: () => void;
}

const AI_MODES: Array<{
  id: DevAiMode;
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    id: 'web-flash',
    name: 'Web Flash',
    badge: 'FAST UI',
    description: 'Fast UI polish, layout adjustments, theme colors, and instant CSS/React tweaks.',
    icon: <Zap className="w-4 h-4 text-cyan-300" aria-hidden="true" />,
    accent: 'border-cyan-400/60 bg-cyan-500/15',
  },
  {
    id: 'study-up',
    name: 'Study Up',
    badge: 'ACADEMIC',
    description: 'Specialized for upgrading Canvas .ics sync, Gizmo/Thea study tools, GPA & focus.',
    icon: <GraduationCap className="w-4 h-4 text-indigo-300" aria-hidden="true" />,
    accent: 'border-indigo-400/60 bg-indigo-500/15',
  },
  {
    id: 'sole-up',
    name: 'Sole Up',
    badge: 'SNEAKER VAULT',
    description: 'Specialized for Sneaker Vault margins, fees, return deadlines, and market checks.',
    icon: <Package className="w-4 h-4 text-emerald-300" aria-hidden="true" />,
    accent: 'border-emerald-400/60 bg-emerald-500/15',
  },
  {
    id: 'deep-ai',
    name: 'DeepAI',
    badge: 'MAX REASONING',
    description: 'Deep reasoning mode for complex multi-part upgrades, architecture, and code generation.',
    icon: <Brain className="w-4 h-4 text-amber-300" aria-hidden="true" />,
    accent: 'border-amber-400/60 bg-amber-500/15',
  },
];

export const DevStudioView: React.FC<DevStudioViewProps> = ({
  upgradeIdeas,
  appliedPatches,
  studyThemeColor,
  soleThemeColor,
  monthlyProfitGoal,
  studioAnnouncement,
  tasksCount,
  sneakersCount,
  onDeleteIdea,
  onClearIdeas,
  onApplyLivePatch,
  onNavigateMode,
  onLockApp,
  onOpenUpgradeCollector,
}) => {
  const [aiMode, setAiMode] = useState<DevAiMode>('web-flash');
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DevStudioResponse | null>(null);
  const [copiedMega, setCopiedMega] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  const megaPrompt = useMemo(
    () => compileMegaUpgradePrompt(upgradeIdeas),
    [upgradeIdeas]
  );

  const activeModeObj = AI_MODES.find((m) => m.id === aiMode) || AI_MODES[0];

  const handleCopyText = async (text: string, which: 'mega' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'mega') {
        setCopiedMega(true);
        setTimeout(() => setCopiedMega(false), 1800);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
      }
    } catch {
      // ignore clipboard errors in headless environments
    }
  };

  const handleRunStudio = async (overridePrompt?: string) => {
    const instr = (overridePrompt ?? promptText).trim();
    const useMega = upgradeIdeas.length > 0 ? megaPrompt : '';
    if (!instr && !useMega) {
      setError('Enter an upgrade instruction or submit notes with the top-right "!" button first.');
      return;
    }

    setLoading(true);
    setError(null);
    setAppliedMsg(null);

    try {
      const res = await fetch('/api/ai/dev-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiMode,
          prompt: instr,
          megaPrompt: useMega,
          workspaceSnapshot: {
            tasksCount,
            sneakersCount,
            monthlyProfitGoal,
            studyThemeColor,
            soleThemeColor,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Dev Studio upgrade.');
      }
      setResult(data as DevStudioResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Dev Studio request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGeneratedPatch = () => {
    if (!result) return;
    const lp = result.livePatch || {};
    const validSole = SOLE_THEME_OPTIONS.some((s) => s.id === lp.soleThemeColor)
      ? (lp.soleThemeColor as SoleThemeColor)
      : undefined;

    onApplyLivePatch({
      title: result.title || 'AI Dev Studio Update',
      aiMode,
      targetArea: result.targetArea || activeModeObj.name,
      studyThemeColor:
        lp.studyThemeColor && /^#[0-9a-fA-F]{3,6}$/.test(lp.studyThemeColor)
          ? lp.studyThemeColor
          : undefined,
      soleThemeColor: validSole,
      monthlyProfitGoal:
        typeof lp.monthlyProfitGoal === 'number' && lp.monthlyProfitGoal > 0
          ? lp.monthlyProfitGoal
          : undefined,
      studioAnnouncement: lp.studioAnnouncement || `${result.title} applied via ${activeModeObj.name}`,
      newTaskTitle: lp.newTaskTitle,
    });
    setAppliedMsg(`Applied "${result.title}" live to workspace!`);
  };

  return (
    <div
      role="main"
      aria-label="Study Sole AI Dev Studio"
      className="min-h-screen flex flex-col bg-[#05070e] text-slate-100"
    >
      {/* Google AI Studio-Inspired Top Bar */}
      <header className="h-16 px-4 lg:px-6 border-b border-white/10 bg-[#090d18]/90 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-amber-400 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-slate-950" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-white whitespace-nowrap">
                Study Sole AI Dev Studio
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-nums font-bold bg-amber-400/15 text-amber-300 border border-amber-400/35">
                PIN 1248 · DEV MODE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Active Engine: <strong className="text-cyan-300">{activeModeObj.name}</strong> · {upgradeIdeas.length} queued ideas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateMode('school')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/35 text-blue-200 border border-blue-400/35 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Study Mode</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateMode('inventory')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-200 border border-emerald-400/35 transition-colors"
          >
            <Package className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sole Vault</span>
          </button>

          <button
            type="button"
            onClick={onLockApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-rose-500/20 text-slate-200 hover:text-rose-200 border border-white/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span className="hidden md:inline">Lock (Esc)</span>
          </button>

          <UpgradeCollectorButton
            ideasCount={upgradeIdeas.length}
            onOpen={onOpenUpgradeCollector}
          />
        </div>
      </header>

      {/* Google AI Studio 3-Column Studio Workbench */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
        {/* Left Panel: Compiled Mega Upgrade Prompt & "!" Queue */}
        <section
          aria-label="Mega Upgrade Prompt Queue"
          className="lg:col-span-4 rounded-2xl bg-[#0b101d] border border-white/10 p-4 flex flex-col gap-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span>Mega Upgrade Prompt</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Auto-compiled from every top-right &ldquo;!&rdquo; note
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleCopyText(megaPrompt, 'mega')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-cyan-200 border border-white/10"
              >
                {copiedMega ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMega ? 'Copied' : 'Copy'}</span>
              </button>
              {upgradeIdeas.length > 0 && (
                <button
                  type="button"
                  onClick={onClearIdeas}
                  className="px-2 py-1 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/15 border border-rose-400/25"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <pre
            data-testid="mega-upgrade-prompt"
            className="rounded-xl bg-slate-950 border border-white/10 p-3 text-xs font-mono-nums text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed"
          >
            {megaPrompt}
          </pre>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPromptText(megaPrompt)}
              disabled={upgradeIdeas.length === 0}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 disabled:opacity-45"
            >
              Load into Editor
            </button>
            <button
              type="button"
              onClick={() => handleRunStudio(megaPrompt)}
              disabled={loading || upgradeIdeas.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-display font-bold bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white hover:brightness-110 disabled:opacity-45"
            >
              <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Execute All</span>
            </button>
          </div>

          {/* Individual Queued Idea Items */}
          <div className="border-t border-white/10 pt-3 flex-1 overflow-y-auto space-y-2 max-h-64">
            <div className="text-[11px] font-mono-nums uppercase tracking-wider text-slate-400">
              Individual Notes ({upgradeIdeas.length})
            </div>
            {upgradeIdeas.length === 0 ? (
              <p className="text-xs text-slate-500">
                Tap &ldquo;!&rdquo; in the top-right corner of any screen to submit an upgrade idea.
              </p>
            ) : (
              upgradeIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-500/20 text-cyan-200 font-mono-nums text-[10px] mr-1.5">
                      {idea.target}
                    </span>
                    <span className="text-slate-200 break-words">{idea.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteIdea(idea.id)}
                    aria-label="Remove upgrade idea"
                    className="p-1 text-slate-500 hover:text-rose-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Center Panel: Prompt Studio Workbench + Generated Snippet / Live Apply */}
        <section
          aria-label="AI Studio Prompt Workbench"
          className="lg:col-span-5 rounded-2xl bg-[#0b101d] border border-white/10 p-4 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-sm text-white">
                System Prompt &amp; Upgrade Generator
              </h2>
              <p className="text-[11px] text-slate-400">
                Write custom instructions or execute queued ideas using {activeModeObj.name}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono-nums font-bold bg-indigo-500/20 text-cyan-200 border border-indigo-400/35">
              {activeModeObj.name}
            </span>
          </div>

          <textarea
            id="dev-studio-prompt"
            rows={5}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={`Write upgrade instructions for ${activeModeObj.name}... (e.g. "Switch Study Mode to dark cyan and raise my sneaker monthly goal to $750")`}
            className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setPromptText('Create a new high-contrast focus card upgrade for Study Mode and set Study theme to #0c2340.')
                }
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              >
                + Study Card Snippet
              </button>
              <button
                type="button"
                onClick={() =>
                  setPromptText('Upgrade Sneaker Vault profit velocity formula and set monthly profit goal to 800.')
                }
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              >
                + Sole Profit Goal
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRunStudio()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400 text-slate-950 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{loading ? 'Generating...' : `Run ${activeModeObj.name}`}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-3.5 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          {appliedMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3.5 py-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{appliedMsg}</span>
            </div>
          )}

          {result ? (
            <div className="flex-1 rounded-xl bg-slate-950 border border-cyan-400/30 p-4 space-y-3 overflow-y-auto max-h-[380px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono-nums uppercase tracking-wider text-cyan-300">
                    {result.targetArea}
                  </span>
                  <h3 className="font-display font-bold text-base text-white">
                    {result.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleApplyGeneratedPatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Apply Live Update</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{result.planSummary}</p>

              {result.implementationSteps?.length > 0 && (
                <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                  {result.implementationSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-nums text-slate-400">
                    Generated TypeScript / React Snippet
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(result.codeSnippet, 'code')}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="rounded-lg bg-[#04070f] border border-white/10 p-3 text-[11px] font-mono-nums text-cyan-100 overflow-x-auto">
                  {result.codeSnippet}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-xl bg-slate-950/60 border border-dashed border-white/10 p-6 flex flex-col items-center justify-center text-center gap-2 text-xs text-slate-400">
              <Code2 className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              <p>
                Select one of the 4 AI Modes on the right, enter an instruction (or click Execute All on your Mega Upgrade Prompt), and generate live Study Sole updates.
              </p>
            </div>
          )}
        </section>

        {/* Right Panel: 4 AI Modes Selector + Instant Live Config Controls */}
        <section
          aria-label="AI Studio Run Settings and Live Patches"
          className="lg:col-span-3 rounded-2xl bg-[#0b101d] border border-white/10 p-4 flex flex-col gap-4"
        >
          <div>
            <h2 className="font-display font-bold text-sm text-white">
              Select AI Studio Mode
            </h2>
            <p className="text-[11px] text-slate-400">
              Choose specialized reasoning model profile
            </p>
          </div>

          <div className="space-y-2">
            {AI_MODES.map((m) => {
              const selected = aiMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiMode(m.id)}
                  data-testid={`dev-mode-${m.id}`}
                  aria-pressed={selected}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    selected
                      ? `${m.accent} shadow-md`
                      : 'bg-slate-950/70 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-display font-bold text-xs text-white">
                      {m.icon}
                      <span>{m.name}</span>
                    </span>
                    <span className="font-mono-nums text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-white/10">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Instant Live Config Controls inside Dev Studio */}
          <div className="border-t border-white/10 pt-3 space-y-2.5">
            <div className="text-[11px] font-mono-nums uppercase tracking-wider text-slate-400">
              Quick Live Overrides
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-300">Study Theme Quick-Set</div>
              <div className="flex flex-wrap gap-1.5">
                {STUDY_THEME_PRESETS.slice(0, 5).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onApplyLivePatch({
                        title: `Set Study Theme to ${preset.label}`,
                        aiMode,
                        targetArea: 'Study Mode Theme',
                        studyThemeColor: preset.hex,
                      })
                    }
                    className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                      studyThemeColor === preset.hex ? 'ring-2 ring-cyan-400' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={`Study: ${preset.label}`}
                    aria-label={`Set Study theme ${preset.label}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-300">Sole Vault Theme Quick-Set</div>
              <div className="flex flex-wrap gap-1.5">
                {SOLE_THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onApplyLivePatch({
                        title: `Set Sole Theme to ${opt.label}`,
                        aiMode,
                        targetArea: 'Sneaker Vault Theme',
                        soleThemeColor: opt.id,
                      })
                    }
                    className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                      soleThemeColor === opt.id ? 'ring-2 ring-emerald-400' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: opt.swatchHex }}
                    title={`Sole: ${opt.label}`}
                    aria-label={`Set Sole theme ${opt.label}`}
                  />
                ))}
              </div>
            </div>

            {studioAnnouncement && (
              <div className="rounded-lg bg-indigo-500/15 border border-indigo-400/35 px-2.5 py-1.5 text-[11px] text-cyan-200">
                Active Banner: {studioAnnouncement}
              </div>
            )}

            {appliedPatches.length > 0 && (
              <div className="pt-1 space-y-1">
                <div className="text-[10px] font-mono-nums uppercase text-slate-400">
                  Recent Applied Updates ({appliedPatches.length})
                </div>
                {appliedPatches.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-lg px-2.5 py-1 truncate"
                  >
                    ✓ {p.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
