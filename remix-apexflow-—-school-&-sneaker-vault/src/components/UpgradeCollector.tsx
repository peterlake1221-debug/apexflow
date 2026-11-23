import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { UpgradeIdeaItem } from '../types/app';

interface UpgradeCollectorButtonProps {
  ideasCount: number;
  onOpen: () => void;
}

export const UpgradeCollectorButton: React.FC<UpgradeCollectorButtonProps> = ({
  ideasCount,
  onOpen,
}) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="upgrade-collector-btn"
      title="Hey Ghirmay, what is needed to upgrade? Save an idea to Dev Studio"
      aria-label="Open Upgrade Idea Collector (!)"
      className="theme-keep-light relative inline-flex items-center justify-center w-8 h-8 rounded-lg font-display font-extrabold text-sm bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 text-white shadow-md shadow-amber-500/25 hover:brightness-110 hover:scale-105 active:scale-95 transition-all shrink-0"
    >
      <span aria-hidden="true">!</span>
      {ideasCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-cyan-400 text-slate-950 font-mono-nums text-[10px] font-bold flex items-center justify-center border border-slate-950">
          {ideasCount}
        </span>
      )}
    </button>
  );
};

interface UpgradeCollectorModalProps {
  open: boolean;
  defaultTarget: UpgradeIdeaItem['target'];
  ideas: UpgradeIdeaItem[];
  onClose: () => void;
  onSubmitIdea: (text: string, target: UpgradeIdeaItem['target']) => void;
}

const TARGETS: Array<UpgradeIdeaItem['target']> = ['General', 'Study', 'Sole', 'Dev'];

export const UpgradeCollectorModal: React.FC<UpgradeCollectorModalProps> = ({
  open,
  defaultTarget,
  ideas,
  onClose,
  onSubmitIdea,
}) => {
  const [text, setText] = useState('');
  const [target, setTarget] = useState<UpgradeIdeaItem['target']>(defaultTarget);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (open) {
      setTarget(defaultTarget);
      setSavedNotice(false);
    }
  }, [open, defaultTarget]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmitIdea(text.trim(), target);
    setText('');
    setSavedNotice(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade Idea Collector"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#090D16] border border-amber-400/45 shadow-[0_24px_80px_rgba(245,158,11,0.24)] p-6 text-white space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center font-display font-extrabold text-sm text-white shrink-0">
              !
            </span>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white leading-snug">
                Hey Ghirmay, what is needed to upgrade?
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every note compiles automatically into your Mega Upgrade Prompt in Dev Mode (PIN 1248).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade collector"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono-nums uppercase tracking-wider text-slate-400 mr-1">
              Target:
            </span>
            {TARGETS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTarget(item)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  target === item
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            id="upgrade-idea-input"
            rows={4}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (savedNotice) setSavedNotice(false);
            }}
            placeholder="Describe any UI tweak, study tool idea, sneaker profit feature, or shortcut you want built..."
            aria-label="Upgrade idea description"
            autoFocus
            className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />

          {savedNotice && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Saved! Added to your running Mega Upgrade Prompt ({ideas.length} total).</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono-nums text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ideas.length} queued in Dev Studio</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white hover:brightness-110 disabled:opacity-45 transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
