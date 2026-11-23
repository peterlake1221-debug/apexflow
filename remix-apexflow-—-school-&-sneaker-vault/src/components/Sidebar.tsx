import React from 'react';
import {
  BookOpen,
  Calendar,
  Calculator,
  Sparkles,
  Package,
  ExternalLink,
  GraduationCap,
  Layers,
  CheckCircle2,
  TrendingDown,
  RotateCcw,
  Lock,
  Plus,
  X,
  Building2,
} from 'lucide-react';
import { AppMode, InventoryTab, SchoolTab } from '../types/app';

interface SidebarProps {
  mode: AppMode;
  schoolTab: SchoolTab;
  inventoryTab: InventoryTab;
  onSelectSchoolTab: (tab: SchoolTab) => void;
  onSelectInventoryTab: (tab: InventoryTab) => void;
  onQuickAddPair: () => void;
  onLockApp: () => void;
  overdueCount: number;
  inHandCount: number;
  soldCount: number;
  returnedCount: number;
  lossCount: number;
  totalPairsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  schoolTab,
  inventoryTab,
  onSelectSchoolTab,
  onSelectInventoryTab,
  onQuickAddPair,
  onLockApp,
  overdueCount,
  inHandCount,
  soldCount,
  returnedCount,
  lossCount,
  totalPairsCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const schoolLinks: Array<{
    id: SchoolTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: 'overview',
      label: 'Homework Board',
      icon: <BookOpen className="w-4 h-4" />,
      count: overdueCount || undefined,
    },
    { id: 'study', label: 'AI Study Hub', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'grades', label: 'Grades', icon: <Calculator className="w-4 h-4" /> },
  ];

  const inventoryLinks: Array<{
    id: InventoryTab;
    label: string;
    icon: React.ReactNode;
    count: number;
    badgeTone: string;
  }> = [
    {
      id: 'all',
      label: 'All Sneaker Stock',
      icon: <Package className="w-4 h-4" />,
      count: totalPairsCount,
      badgeTone: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'in-hand',
      label: 'In Hand Pairs',
      icon: <Layers className="w-4 h-4" />,
      count: inHandCount,
      badgeTone: 'bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'sold',
      label: 'Sold Ledger',
      icon: <CheckCircle2 className="w-4 h-4" />,
      count: soldCount,
      badgeTone: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'returned',
      label: 'Returned Shoes',
      icon: <RotateCcw className="w-4 h-4" />,
      count: returnedCount,
      badgeTone: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'losses',
      label: 'Losses Ledger',
      icon: <TrendingDown className="w-4 h-4" />,
      count: lossCount,
      badgeTone: 'bg-rose-500/20 text-rose-300',
    },
  ];

  const isSchool = mode === 'school';

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Primary Navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-950/80 backdrop-blur-md border-r transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSchool ? 'border-blue-500/25' : 'border-emerald-500/25'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between px-5 h-16 border-b ${
            isSchool ? 'border-blue-500/20' : 'border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/logo_study_sole_1795360360333.jpg"
              alt="Study Sole logo"
              referrerPolicy="no-referrer"
              className={`w-9 h-9 rounded-lg object-cover border shrink-0 ${
                isSchool ? 'border-blue-400/45' : 'border-emerald-400/45'
              }`}
            />
            <div className="min-w-0">
              <span className="font-display font-bold text-sm tracking-tight text-white whitespace-nowrap block leading-tight">
                Study Sole v2.0
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono-nums font-semibold uppercase tracking-wider ${
                  isSchool ? 'text-cyan-300' : 'text-emerald-300'
                }`}
              >
                {!isSchool && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                    aria-hidden="true"
                  />
                )}
                <span>{isSchool ? 'ACADEMIC HUB' : 'BUSINESS VAULT'}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {isSchool ? (
            <>
              <div>
                <div className="px-2.5 mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-mono-nums font-semibold tracking-wider text-blue-400 uppercase">
                    School Workspace
                  </span>
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                </div>
                <nav className="space-y-1">
                  {schoolLinks.map((item) => {
                    const active = schoolTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectSchoolTab(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                          active
                            ? 'bg-gradient-to-r from-blue-600/25 to-indigo-600/20 text-blue-200 border border-blue-400/45 shadow-[0_4px_18px_rgba(37,99,235,0.22)]'
                            : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={active ? 'text-blue-300' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        {item.count ? (
                          <span className="font-mono-nums text-xs px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {item.count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/10 pt-5">
                <div className="px-2.5 mb-2 text-[11px] font-mono-nums font-semibold tracking-wider text-slate-400 uppercase">
                  Quick Launch
                </div>
                <div className="space-y-1.5">
                  <a
                    href="https://canvas.instructure.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                  >
                    <span>Canvas LMS</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  </a>
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                  >
                    <span>Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  </a>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                  >
                    <span>Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="px-2.5 mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-mono-nums font-semibold tracking-wider text-emerald-400 uppercase">
                    Sneaker Business
                  </span>
                  <span className="font-mono-nums text-[11px] text-amber-300">
                    {inHandCount} in hand
                  </span>
                </div>
                <nav className="space-y-1">
                  {inventoryLinks.map((item) => {
                    const active = inventoryTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectInventoryTab(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                          active
                            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 text-emerald-200 border border-emerald-400/45 shadow-[0_4px_18px_rgba(16,185,129,0.2)]'
                            : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={active ? 'text-emerald-300' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <span
                          className={`font-mono-nums text-xs px-1.5 py-0.5 rounded-md ${item.badgeTone}`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-2.5">
                <div className="px-2.5 text-[11px] font-mono-nums font-semibold tracking-wider text-slate-400 uppercase">
                  Vault Controls
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onQuickAddPair();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:brightness-110 transition-all"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add New Sneaker Pair</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLockApp();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-rose-500/15 text-amber-300 hover:text-rose-200 border border-amber-400/30 hover:border-rose-400/35 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Lock Vault</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
