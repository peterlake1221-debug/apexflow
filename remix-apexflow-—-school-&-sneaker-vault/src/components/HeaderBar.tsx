import React, { useRef } from 'react';
import {
  Download,
  Upload,
  Menu,
  Bot,
  Lock,
} from 'lucide-react';
import {
  AppMode,
  InventoryTab,
  SchoolTab,
  SoleThemeColor,
  StudyProgressStats,
} from '../types/app';
import { getBackupAgeDays } from '../utils/studyAndGrades';
import { ThemeSwitcherPopover } from './ThemeSwitcherPopover';
import { UpgradeCollectorButton } from './UpgradeCollector';

interface HeaderBarProps {
  mode: AppMode;
  schoolTab: SchoolTab;
  inventoryTab: InventoryTab;
  studyStats: StudyProgressStats;
  lastBackupAt: string | null;
  studyThemeColor: string;
  soleThemeColor: SoleThemeColor;
  upgradeIdeasCount: number;
  onChangeStudyTheme: (hex: string) => void;
  onChangeSoleTheme: (color: SoleThemeColor) => void;
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => void;
  onLockApp: () => void;
  onOpenUpgradeCollector: () => void;
  onToggleAiSidebar: () => void;
  aiSidebarOpen: boolean;
  onOpenMobileMenu: () => void;
  backupMessage: string | null;
}

const SCHOOL_TAB_TITLES: Record<SchoolTab, string> = {
  overview: 'Homework & Study City',
  city: 'Study City & Quests',
  study: 'Thea-Style AI Study Hub',
  calendar: 'Canvas .ics & Calendar',
  grades: 'Grades, Links & Pomodoro',
};

const INVENTORY_TAB_TITLES: Record<InventoryTab, string> = {
  all: 'Sneaker Vault & Profit',
  'in-hand': 'Active In-Hand Stock',
  sold: 'Sold Pairs & Realized Profit',
  returned: 'Returned Shoes & Return Deadlines',
  losses: 'Losses Ledger',
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  mode,
  schoolTab,
  inventoryTab,
  studyStats,
  lastBackupAt,
  studyThemeColor,
  soleThemeColor,
  upgradeIdeasCount,
  onChangeStudyTheme,
  onChangeSoleTheme,
  onExportBackup,
  onImportBackupFile,
  onLockApp,
  onOpenUpgradeCollector,
  onToggleAiSidebar,
  aiSidebarOpen,
  onOpenMobileMenu,
  backupMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupAgeDays = getBackupAgeDays(lastBackupAt);
  const isSchool = mode === 'school';

  const backupLabel =
    backupAgeDays === null
      ? 'No backup exported yet'
      : backupAgeDays === 0
        ? 'Last backup: Today (0d ago)'
        : `Last backup: ${backupAgeDays} ${backupAgeDays === 1 ? 'day' : 'days'} ago`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackupFile(file);
      e.target.value = '';
    }
  };

  return (
    <header
      className={`relative z-40 h-16 px-3 lg:px-4 border-b bg-[#090D16]/80 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 ${
        isSchool ? 'border-blue-500/25' : 'border-emerald-500/25'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex min-w-0 items-center gap-2">
          <span className="font-display font-bold text-xs sm:text-sm text-white whitespace-nowrap shrink-0">
            Study Sole v2.0
          </span>
          <span
            className={`font-display font-semibold text-[11px] sm:text-xs whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md border ${
              isSchool
                ? 'bg-indigo-500/15 text-cyan-200 border-indigo-400/35'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
            }`}
          >
            {isSchool ? 'School Mode' : 'Sneaker Vault'}
          </span>
          <span className="hidden 2xl:inline text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="hidden 2xl:inline text-xs font-medium text-slate-300 truncate">
            {isSchool ? SCHOOL_TAB_TITLES[schoolTab] : INVENTORY_TAB_TITLES[inventoryTab]}
          </span>
          {backupMessage && (
            <span className="hidden 2xl:inline text-xs text-emerald-400 truncate ml-2">
              {backupMessage}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Live Study Streak & XP Counter */}
        <span
          title={`Active Study Streak: ${studyStats.streakDays} days · ${studyStats.xp} XP`}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-mono-nums font-semibold bg-amber-500/15 text-amber-200 border border-amber-400/35 whitespace-nowrap shrink-0"
        >
          <span aria-hidden="true">🔥</span>
          <span>{studyStats.streakDays}d</span>
          <span className="hidden md:inline text-amber-400/50" aria-hidden="true">·</span>
          <span className="hidden md:inline text-cyan-200">{studyStats.xp} XP</span>
        </span>

        {/* Custom Theme & Background Color Switcher */}
        <ThemeSwitcherPopover
          mode={mode}
          studyThemeColor={studyThemeColor}
          soleThemeColor={soleThemeColor}
          onChangeStudyTheme={onChangeStudyTheme}
          onChangeSoleTheme={onChangeSoleTheme}
        />

        <button
          type="button"
          onClick={onExportBackup}
          title={`${backupLabel} · Click to Export Backup (.json)`}
          aria-label="Export Backup"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span className="hidden 2xl:inline">Export</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import backup JSON file"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Import Backup (.json)"
          aria-label="Import Backup"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
          <span className="hidden 2xl:inline">Import</span>
        </button>

        <button
          type="button"
          onClick={onToggleAiSidebar}
          aria-pressed={aiSidebarOpen}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
            aiSidebarOpen
              ? isSchool
                ? 'bg-indigo-600/25 text-indigo-200 border-indigo-400/50'
                : 'bg-emerald-600/25 text-emerald-200 border-emerald-400/50'
              : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span className="hidden sm:inline">Kova AI</span>
        </button>

        <button
          type="button"
          onClick={onLockApp}
          title="Lock screen (Esc)"
          aria-label="Lock screen"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-rose-500/15 text-slate-200 hover:text-rose-200 border border-white/10 hover:border-rose-400/35 transition-colors whitespace-nowrap shrink-0"
        >
          <Lock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
          <span className="hidden sm:inline">Lock</span>
        </button>

        {/* Persistent Top-Right "!" Upgrade Collector */}
        <UpgradeCollectorButton
          ideasCount={upgradeIdeasCount}
          onOpen={onOpenUpgradeCollector}
        />
      </div>
    </header>
  );
};
