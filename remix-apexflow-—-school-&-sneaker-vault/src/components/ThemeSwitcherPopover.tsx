import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, X } from 'lucide-react';
import { AppMode, SoleThemeColor } from '../types/app';
import {
  SOLE_THEME_OPTIONS,
  STUDY_THEME_PRESETS,
  normalizeHexColor,
} from '../utils/themeUtils';

interface ThemeSwitcherPopoverProps {
  mode: AppMode;
  studyThemeColor: string;
  soleThemeColor: SoleThemeColor;
  onChangeStudyTheme: (hex: string) => void;
  onChangeSoleTheme: (color: SoleThemeColor) => void;
}

export const ThemeSwitcherPopover: React.FC<ThemeSwitcherPopoverProps> = ({
  mode,
  studyThemeColor,
  soleThemeColor,
  onChangeStudyTheme,
  onChangeSoleTheme,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; right: number }>({
    top: 64,
    right: 16,
  });

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open]);

  if (mode === 'dev') return null;

  const isStudy = mode === 'school';
  const activeSwatch = isStudy
    ? normalizeHexColor(studyThemeColor, '#04070f')
    : SOLE_THEME_OPTIONS.find((s) => s.id === soleThemeColor)?.swatchHex || '#090d16';

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Customize Theme & Background Color"
        title={isStudy ? 'Study Mode Theme Colors' : 'Sole Vault Theme Colors'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors whitespace-nowrap shrink-0"
      >
        <span
          className="w-3 h-3 rounded-full border border-white/40 shrink-0"
          style={{ backgroundColor: activeSwatch }}
          aria-hidden="true"
        />
        <Palette className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
        <span className="hidden md:inline">Theme</span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-label="Theme Color Picker"
            style={{ top: coords.top, right: coords.right }}
            className="theme-keep-light fixed z-[90] w-72 rounded-2xl bg-[#090D16]/95 backdrop-blur-xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.65)] p-4 text-white space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <div className="font-display font-bold text-xs text-white">
                  {isStudy ? 'Study Mode Theme Colors' : 'Sole Vault Theme Colors'}
                </div>
              <div className="text-[11px] text-slate-400">
                {isStudy
                  ? 'Black, White, or any Rainbow color'
                  : 'Choose Black, White, Red, Green, Blue, or Yellow'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close theme picker"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {isStudy ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono-nums font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
                  Light Colors (Crisp Dark Ink)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STUDY_THEME_PRESETS.slice(1, 7).map((preset) => {
                    const selected =
                      normalizeHexColor(studyThemeColor) === preset.hex;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChangeStudyTheme(preset.hex)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-blue-500/25 border-blue-400 text-slate-950 font-bold'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {selected && <Check className="w-2.5 h-2.5 text-slate-950 font-extrabold" />}
                        </span>
                        <span className="truncate">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono-nums font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                  Dark Presets &amp; Deep Gradients
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[STUDY_THEME_PRESETS[0], ...STUDY_THEME_PRESETS.slice(7)].map((preset) => {
                    const selected =
                      normalizeHexColor(studyThemeColor) === preset.hex;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChangeStudyTheme(preset.hex)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-indigo-500/25 border-cyan-400 text-white'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/35 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="truncate">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <label
                  htmlFor="study-rainbow-color"
                  className="text-xs font-medium text-slate-300"
                >
                  Any Rainbow Color:
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono-nums text-[11px] text-cyan-300">
                    {normalizeHexColor(studyThemeColor).toUpperCase()}
                  </span>
                  <input
                    id="study-rainbow-color"
                    type="color"
                    aria-label="Pick any rainbow color for Study Mode"
                    value={normalizeHexColor(studyThemeColor)}
                    onChange={(e) => onChangeStudyTheme(e.target.value)}
                    className="w-9 h-7 rounded-md cursor-pointer bg-transparent border border-white/20"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {SOLE_THEME_OPTIONS.map((opt) => {
                const selected = soleThemeColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeSoleTheme(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/35 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: opt.swatchHex }}
                    >
                      {selected && (
                        <Check
                          className={`w-2.5 h-2.5 ${
                            opt.isLight ? 'text-slate-950' : 'text-white'
                          }`}
                        />
                      )}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>,
          document.body
        )}
    </div>
  );
};
