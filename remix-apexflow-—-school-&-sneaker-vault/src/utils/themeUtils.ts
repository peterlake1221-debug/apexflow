import { AppMode, SoleThemeColor } from '../types/app';

export interface StudyThemePreset {
  id: string;
  label: string;
  hex: string;
  swatchClass: string;
}

export const STUDY_THEME_PRESETS: StudyThemePreset[] = [
  { id: 'black', label: 'Black', hex: '#04070f', swatchClass: 'bg-[#04070f] border-slate-500' },
  { id: 'white', label: 'Cloud White', hex: '#f8fafc', swatchClass: 'bg-[#f8fafc] border-slate-300' },
  { id: 'sky', label: 'Sky Blue', hex: '#eff6ff', swatchClass: 'bg-[#eff6ff] border-blue-300' },
  { id: 'mint', label: 'Mint Breeze', hex: '#ecfdf5', swatchClass: 'bg-[#ecfdf5] border-emerald-300' },
  { id: 'lilac', label: 'Ice Lilac', hex: '#f4f3ff', swatchClass: 'bg-[#f4f3ff] border-indigo-300' },
  { id: 'cream', label: 'Sunlit Cream', hex: '#fefce8', swatchClass: 'bg-[#fefce8] border-amber-300' },
  { id: 'seafoam', label: 'Seafoam Mist', hex: '#f0fdfa', swatchClass: 'bg-[#f0fdfa] border-cyan-300' },
  { id: 'indigo', label: 'Indigo', hex: '#1e1b4b', swatchClass: 'bg-indigo-900 border-indigo-400' },
  { id: 'blue', label: 'Blue', hex: '#0c2340', swatchClass: 'bg-blue-900 border-blue-400' },
  { id: 'cyan', label: 'Cyan', hex: '#083344', swatchClass: 'bg-cyan-900 border-cyan-400' },
  { id: 'emerald', label: 'Green', hex: '#064e3b', swatchClass: 'bg-emerald-900 border-emerald-400' },
  { id: 'purple', label: 'Violet', hex: '#3b0764', swatchClass: 'bg-purple-900 border-purple-400' },
  { id: 'rose', label: 'Red', hex: '#4c0519', swatchClass: 'bg-rose-900 border-rose-400' },
  { id: 'amber', label: 'Gold', hex: '#451a03', swatchClass: 'bg-amber-900 border-amber-400' },
];

export interface SoleThemeOption {
  id: SoleThemeColor;
  label: string;
  bgHex: string;
  accentHex: string;
  swatchHex: string;
  isLight: boolean;
}

export const SOLE_THEME_OPTIONS: SoleThemeOption[] = [
  {
    id: 'black',
    label: 'Black',
    bgHex: '#04070f',
    accentHex: 'rgba(16, 185, 129, 0.22)',
    swatchHex: '#090d16',
    isLight: false,
  },
  {
    id: 'white',
    label: 'White',
    bgHex: '#f8fafc',
    accentHex: 'rgba(16, 185, 129, 0.14)',
    swatchHex: '#ffffff',
    isLight: true,
  },
  {
    id: 'red',
    label: 'Red',
    bgHex: '#28060e',
    accentHex: 'rgba(244, 63, 94, 0.28)',
    swatchHex: '#dc2626',
    isLight: false,
  },
  {
    id: 'green',
    label: 'Green',
    bgHex: '#032217',
    accentHex: 'rgba(16, 185, 129, 0.28)',
    swatchHex: '#10b981',
    isLight: false,
  },
  {
    id: 'blue',
    label: 'Blue',
    bgHex: '#071738',
    accentHex: 'rgba(59, 130, 246, 0.28)',
    swatchHex: '#2563eb',
    isLight: false,
  },
  {
    id: 'yellow',
    label: 'Yellow',
    bgHex: '#fef08a',
    accentHex: 'rgba(234, 179, 8, 0.28)',
    swatchHex: '#facc15',
    isLight: true,
  },
];

export function normalizeHexColor(input: string, fallback = '#04070f'): string {
  const clean = (input || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const r = clean[1];
    const g = clean[2];
    const b = clean[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function getRelativeLuminance(hex: string): number {
  const normalized = normalizeHexColor(hex);
  const r8 = parseInt(normalized.slice(1, 3), 16) / 255;
  const g8 = parseInt(normalized.slice(3, 5), 16) / 255;
  const b8 = parseInt(normalized.slice(5, 7), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r8) + 0.7152 * toLinear(g8) + 0.0722 * toLinear(b8);
}

export function isLightHexColor(hex: string): boolean {
  return getRelativeLuminance(hex) >= 0.42;
}

export interface WorkspaceThemeVisuals {
  backgroundColor: string;
  backgroundImage: string;
  isLight: boolean;
  swatchHex: string;
  label: string;
}

export function resolveWorkspaceTheme(
  mode: AppMode,
  studyThemeColor: string,
  soleThemeColor: SoleThemeColor
): WorkspaceThemeVisuals {
  if (mode === 'dev') {
    return {
      backgroundColor: '#05070e',
      backgroundImage:
        'radial-gradient(ellipse at 18% 12%, rgba(99, 102, 241, 0.22), transparent 46%), radial-gradient(ellipse at 85% 88%, rgba(6, 182, 212, 0.18), transparent 46%)',
      isLight: false,
      swatchHex: '#6366f1',
      label: 'AI Studio',
    };
  }

  if (mode === 'inventory') {
    const opt =
      SOLE_THEME_OPTIONS.find((item) => item.id === soleThemeColor) ||
      SOLE_THEME_OPTIONS[0];
    return {
      backgroundColor: opt.bgHex,
      backgroundImage: `radial-gradient(ellipse at 16% 12%, ${opt.accentHex}, transparent 52%), radial-gradient(ellipse at 86% 86%, rgba(245, 158, 11, 0.14), transparent 50%)`,
      isLight: opt.isLight,
      swatchHex: opt.swatchHex,
      label: opt.label,
    };
  }

  const safeHex = normalizeHexColor(studyThemeColor, '#04070f');
  const isLight = isLightHexColor(safeHex);
  const preset = STUDY_THEME_PRESETS.find((p) => p.hex === safeHex);

  return {
    backgroundColor: safeHex,
    backgroundImage: isLight
      ? 'radial-gradient(ellipse at 16% 10%, rgba(79, 70, 229, 0.12), transparent 50%), radial-gradient(ellipse at 86% 88%, rgba(14, 165, 233, 0.12), transparent 50%)'
      : 'radial-gradient(ellipse at 16% 10%, rgba(255, 255, 255, 0.08), transparent 48%), radial-gradient(ellipse at 86% 88%, rgba(56, 189, 248, 0.14), transparent 48%)',
    isLight,
    swatchHex: safeHex,
    label: preset ? preset.label : safeHex.toUpperCase(),
  };
}
