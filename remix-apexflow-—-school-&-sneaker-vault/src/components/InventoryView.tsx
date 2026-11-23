import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pause,
  Play,
  Copy,
  Pencil,
  Trash2,
  TrendingDown,
  DollarSign,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  Target,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  InventoryTab,
  ModelFamily,
  SneakerCategory,
  SneakerPair,
  SneakerStatus,
} from '../types/app';
import {
  SNEAKER_SIZES,
  buildMarketLookupUrls,
  calculateBreakEvenPrice,
  calculateDaysHeld,
  calculateNetProfit,
  calculateROI,
  calculateTargetSellPrice,
  computeInventorySummary,
  computeMonthlyProfitProgress,
  getReturnDeadlineAlert,
  inferBrandName,
} from '../utils/sneakerMath';
import { isValidPinFormat } from '../utils/studyAndGrades';
import { AnimatedNumber } from './AnimatedNumber';
import { SpinningShoe } from './SpinningShoe';
import { PairFormModal } from './PairFormModal';
import { SneakerProfitChart } from './SneakerProfitChart';

interface InventoryViewProps {
  sneakers: SneakerPair[];
  activeTab: InventoryTab;
  onChangeTab: (tab: InventoryTab) => void;
  motionPaused: boolean;
  onToggleMotion: () => void;
  onAddPair: (pair: Omit<SneakerPair, 'id'>) => void;
  onUpdatePair: (pair: SneakerPair) => void;
  onDeletePair: (id: string) => void;
  onUpdatePin: (newPin: string) => void;
  monthlyProfitGoal: number;
  onUpdateProfitGoal: (goal: number) => void;
  addPairTrigger: number;
}

const MODEL_FAMILIES: Array<'All' | ModelFamily> = [
  'All',
  'Samba',
  'Spezial',
  'Dunk',
  'Jordan 1',
  'Jordan 4',
  'Other',
];

const TAB_TO_STATUS: Record<InventoryTab, 'All' | SneakerStatus> = {
  all: 'All',
  'in-hand': 'In Hand',
  sold: 'Sold',
  returned: 'Returned',
  losses: 'Loss',
};

const STATUS_TO_TAB: Record<'All' | SneakerStatus, InventoryTab> = {
  All: 'all',
  'In Hand': 'in-hand',
  Sold: 'sold',
  Returned: 'returned',
  Loss: 'losses',
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  sneakers,
  activeTab,
  onChangeTab,
  motionPaused,
  onToggleMotion,
  onAddPair,
  onUpdatePair,
  onDeletePair,
  onUpdatePin,
  monthlyProfitGoal,
  onUpdateProfitGoal,
  addPairTrigger,
}) => {
  const [familyFilter, setFamilyFilter] = useState<'All' | ModelFamily>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | SneakerCategory>('All');
  const [sizeFilter, setSizeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<SneakerPair | null>(null);
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(addPairTrigger);

  if (addPairTrigger !== lastTrigger) {
    setLastTrigger(addPairTrigger);
    setEditingPair(null);
    setDuplicateMode(false);
    setModalOpen(true);
  }

  // Vault PIN quick-update popover
  const [showPinEditor, setShowPinEditor] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [pinSavedMsg, setPinSavedMsg] = useState<string | null>(null);

  // Editable Monthly Profit Goal
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(monthlyProfitGoal));

  // Quick Mark Sold / Mark Returned inline prompt
  const [sellingPairId, setSellingPairId] = useState<string | null>(null);
  const [quickSellPrice, setQuickSellPrice] = useState('');
  const [returningPairId, setReturningPairId] = useState<string | null>(null);
  const [quickReturnDeadline, setQuickReturnDeadline] = useState('');

  const statusTab = TAB_TO_STATUS[activeTab];
  const summary = useMemo(() => computeInventorySummary(sneakers), [sneakers]);
  const profitGoalProgress = useMemo(
    () => computeMonthlyProfitProgress(sneakers, monthlyProfitGoal),
    [sneakers, monthlyProfitGoal]
  );

  const familyStats = useMemo(() => {
    const map = new Map<ModelFamily, { count: number; capital: number }>();
    for (const pair of sneakers) {
      if (pair.status === 'Loss' || pair.status === 'Returned') continue;
      const cur = map.get(pair.modelFamily) || { count: 0, capital: 0 };
      cur.count += 1;
      if (pair.status === 'In Hand') {
        cur.capital += pair.buyPrice;
      }
      map.set(pair.modelFamily, cur);
    }
    return map;
  }, [sneakers]);

  const filteredPairs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sneakers.filter((pair) => {
      if (statusTab !== 'All' && pair.status !== statusTab) return false;
      if (familyFilter !== 'All' && pair.modelFamily !== familyFilter) return false;
      if (categoryFilter !== 'All' && pair.category !== categoryFilter) return false;
      if (sizeFilter !== 'All' && pair.size !== sizeFilter) return false;
      if (
        q &&
        !pair.modelName.toLowerCase().includes(q) &&
        !pair.sourceNote.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [sneakers, statusTab, familyFilter, categoryFilter, sizeFilter, searchQuery]);

  const returnedPairs = useMemo(
    () => sneakers.filter((s) => s.status === 'Returned'),
    [sneakers]
  );

  const urgentReturnAlerts = useMemo(
    () =>
      sneakers
        .map((pair) => ({
          pair,
          alert: getReturnDeadlineAlert(pair.returnDeadline, pair.status),
        }))
        .filter((entry): entry is { pair: SneakerPair; alert: NonNullable<ReturnType<typeof getReturnDeadlineAlert>> } =>
          Boolean(entry.alert?.isUrgent)
        ),
    [sneakers]
  );

  const lossPairs = useMemo(
    () => sneakers.filter((s) => s.status === 'Loss'),
    [sneakers]
  );

  const handleConfirmQuickSell = (pair: SneakerPair) => {
    const price = Number(quickSellPrice);
    if (!Number.isFinite(price) || price <= 0) return;
    onUpdatePair({
      ...pair,
      status: 'Sold',
      soldPrice: price,
      soldDate: new Date().toISOString().slice(0, 10),
    });
    setSellingPairId(null);
    setQuickSellPrice('');
  };

  const handleConfirmQuickReturn = (pair: SneakerPair) => {
    onUpdatePair({
      ...pair,
      status: 'Returned',
      returnDeadline: quickReturnDeadline.trim() || pair.returnDeadline,
    });
    setReturningPairId(null);
    setQuickReturnDeadline('');
  };

  const handleMarkAsLoss = (pair: SneakerPair) => {
    onUpdatePair({
      ...pair,
      status: 'Loss',
      soldPrice: pair.soldPrice ?? 0,
      soldDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleSaveFromModal = (data: Omit<SneakerPair, 'id'>, existingId?: string) => {
    if (existingId) {
      onUpdatePair({ ...data, id: existingId });
    } else {
      onAddPair(data);
    }
  };

  const marketTargetPair = filteredPairs[0] || sneakers[0];
  const marketModelQuery =
    searchQuery.trim() || marketTargetPair?.modelName || 'Nike Dunk Low';
  const marketSizeQuery =
    sizeFilter !== 'All'
      ? sizeFilter
      : searchQuery.trim()
        ? ''
        : marketTargetPair?.size || '';
  const marketUrls = useMemo(
    () => buildMarketLookupUrls(marketModelQuery, marketSizeQuery),
    [marketModelQuery, marketSizeQuery]
  );

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(goalDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onUpdateProfitGoal(Math.round(parsed));
    setEditingGoal(false);
  };

  const handleSavePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPinFormat(pinDraft)) {
      setPinSavedMsg('PIN must be 4 digits.');
      return;
    }
    onUpdatePin(pinDraft);
    setPinDraft('');
    setPinSavedMsg('Vault PIN updated.');
  };

  const renderPairCard = (pair: SneakerPair) => {
    const breakEven = calculateBreakEvenPrice(pair.buyPrice, pair.feePercent);
    const target30 = calculateTargetSellPrice(pair.buyPrice, pair.feePercent, 30);
    const netProfit = calculateNetProfit(pair);
    const roi =
      pair.status === 'In Hand' ? 0 : calculateROI(netProfit, pair.buyPrice);
    const daysHeld = calculateDaysHeld(
      pair.purchaseDate,
      pair.status === 'In Hand' ? undefined : pair.soldDate
    );

    const staleWarning =
      pair.status === 'In Hand' && daysHeld >= 30
        ? '30+ days held'
        : pair.status === 'In Hand' && daysHeld >= 14
          ? '14+ days held'
          : null;

    const returnAlert = getReturnDeadlineAlert(pair.returnDeadline, pair.status);

    return (
      <article
        key={pair.id}
        data-testid="sneaker-card"
        className={`hud-corners rounded-2xl bg-slate-900/60 backdrop-blur-md border px-4 py-3.5 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-1 transition-all duration-200 ${
          pair.status === 'Loss'
            ? 'hud-rose border-rose-500/35 hover:shadow-[0_14px_34px_rgba(244,63,94,0.16)]'
            : pair.status === 'Returned'
              ? 'hud-amber border-amber-400/45 hover:shadow-[0_14px_34px_rgba(245,158,11,0.18)]'
              : pair.status === 'Sold'
                ? 'hud-cyan border-cyan-500/35 hover:shadow-[0_14px_34px_rgba(6,182,212,0.18)]'
                : 'hud-emerald border-emerald-500/35 hover:border-emerald-400/70 hover:shadow-[0_14px_36px_rgba(16,185,129,0.22)]'
        }`}
      >
        {/* Row 1: CSS-spinning shoe + Model Name + Stat Pills */}
        <div className="flex items-center gap-3.5">
          <SpinningShoe
            imageUrl={pair.imageUrl}
            modelName={pair.modelName}
            paused={motionPaused}
            size="sm"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                {pair.modelName}
              </h3>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/35">
                  {inferBrandName(pair.modelName)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/35">
                  {pair.condition}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-200 border border-cyan-400/35 font-mono-nums">
                  {pair.category} {pair.size}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md border ${
                    pair.status === 'Sold'
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                      : pair.status === 'Loss'
                        ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                        : pair.status === 'Returned'
                          ? 'bg-amber-500/20 text-amber-200 border-amber-400/45'
                          : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  }`}
                >
                  {pair.status}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 mt-1 truncate">
              {pair.modelFamily} · {pair.sourceNote} · Purchased {pair.purchaseDate}
            </div>
          </div>
        </div>

        {/* Row 2: Buy Price, Target (+30%) / Break-Even, Sold Price, ROI % */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2.5 border-t border-white/10 text-[11px]">
          <div className="rounded-lg bg-slate-950/60 px-2 py-1.5 border border-white/5 min-w-0">
            <span className="text-slate-400 block whitespace-nowrap text-[10px]">Buy Price</span>
            <span className="font-mono-nums font-semibold text-white">
              ${pair.buyPrice.toFixed(0)}
            </span>
          </div>
          <div className="rounded-lg bg-slate-950/60 px-2 py-1.5 border border-white/5 min-w-0">
            <span className="text-slate-400 block whitespace-nowrap text-[10px]">Target / BE</span>
            <span className="font-mono-nums font-semibold text-emerald-300 whitespace-nowrap">
              ${target30.toFixed(0)}/${breakEven.toFixed(0)}
            </span>
          </div>
          <div className="rounded-lg bg-slate-950/60 px-2 py-1.5 border border-white/5 min-w-0">
            <span className="text-slate-400 block whitespace-nowrap text-[10px]">
              {pair.status === 'Loss'
                ? 'Recovered'
                : pair.status === 'Returned'
                  ? 'Refund'
                  : 'Sold Price'}
            </span>
            <span className="font-mono-nums font-semibold text-cyan-300">
              {pair.status === 'Returned'
                ? `$${pair.buyPrice.toFixed(0)}`
                : pair.soldPrice !== undefined
                  ? `$${pair.soldPrice.toFixed(0)}`
                  : '—'}
            </span>
          </div>
          <div className="rounded-lg bg-slate-950/60 px-2 py-1.5 border border-white/5 min-w-0">
            <span className="text-slate-400 block whitespace-nowrap text-[10px]">Net / ROI</span>
            {pair.status === 'In Hand' ? (
              <span className="font-mono-nums text-slate-300 whitespace-nowrap">
                Fee {pair.feePercent}%
              </span>
            ) : pair.status === 'Returned' ? (
              <span className="font-mono-nums text-amber-300 font-semibold whitespace-nowrap">
                Returned ($0)
              </span>
            ) : (
              <span
                className={`font-mono-nums text-[10px] font-bold tracking-tight whitespace-nowrap ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netProfit >= 0 ? '+' : '-'}${Math.abs(netProfit).toFixed(0)} ({roi >= 0 ? '+' : ''}
                {Math.round(roi)}%)
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Days in Stock / Return 4-Day Deadline Badge + Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono-nums text-slate-400 whitespace-nowrap">
              {daysHeld}d held
            </span>
            {staleWarning && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/35 font-mono-nums text-[11px] whitespace-nowrap">
                {staleWarning}
              </span>
            )}
            {returnAlert && (
              <span
                data-testid="return-deadline-badge"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono-nums text-[11px] font-bold border whitespace-nowrap ${
                  returnAlert.isUrgent
                    ? 'bg-rose-500/20 text-rose-200 border-rose-400/55 animate-pulse'
                    : 'bg-amber-500/15 text-amber-200 border-amber-400/35'
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{returnAlert.label}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {pair.status === 'In Hand' &&
              sellingPairId !== pair.id &&
              returningPairId !== pair.id && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSellingPairId(pair.id);
                      setQuickSellPrice(String(Math.round(target30)));
                    }}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 transition-colors whitespace-nowrap"
                  >
                    Mark Sold
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturningPairId(pair.id);
                      const plusThree = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .slice(0, 10);
                      setQuickReturnDeadline(pair.returnDeadline || plusThree);
                    }}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 border border-amber-400/35 transition-colors whitespace-nowrap"
                  >
                    Mark Returned
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAsLoss(pair)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-rose-500/15 hover:bg-rose-500/30 text-rose-200 border border-rose-400/35 transition-colors whitespace-nowrap"
                  >
                    Mark Loss
                  </button>
                </>
              )}

            {sellingPairId === pair.id && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  aria-label={`Sold price for ${pair.modelName}`}
                  value={quickSellPrice}
                  onChange={(e) => setQuickSellPrice(e.target.value)}
                  className="w-20 rounded-md bg-slate-950 border border-emerald-400 px-2 py-1 text-xs font-mono-nums text-white"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmQuickSell(pair)}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-400 text-slate-950"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setSellingPairId(null)}
                  className="px-1.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}

            {returningPairId === pair.id && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  aria-label={`Return deadline for ${pair.modelName}`}
                  value={quickReturnDeadline}
                  onChange={(e) => setQuickReturnDeadline(e.target.value)}
                  className="rounded-md bg-slate-950 border border-amber-400 px-2 py-1 text-xs font-mono-nums text-white"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmQuickReturn(pair)}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-400 text-slate-950 whitespace-nowrap"
                >
                  Save Return
                </button>
                <button
                  type="button"
                  onClick={() => setReturningPairId(null)}
                  className="px-1.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingPair(pair);
                setDuplicateMode(true);
                setModalOpen(true);
              }}
              aria-label={`Add another of ${pair.modelName}`}
              title="Add Another of This Shoe"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 whitespace-nowrap"
            >
              <Copy className="w-3 h-3 text-cyan-400" aria-hidden="true" />
              <span>+1 Pair</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPair(pair);
                setDuplicateMode(false);
                setModalOpen(true);
              }}
              aria-label={`Edit ${pair.modelName}`}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDeletePair(pair.id)}
              aria-label={`Delete ${pair.modelName}`}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono-nums font-semibold uppercase tracking-wider text-emerald-300 mb-1">
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]"
              aria-hidden="true"
            />
            <span>BUSINESS VAULT · LIVE PROFIT TELEMETRY</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">
            Sneaker Inventory &amp; Profit Vault
          </h1>
          <p className="text-sm text-slate-400">
            Track pairs in hand, true net profit after fees, capital tied up, and losses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setShowPinEditor((s) => !s);
              setPinSavedMsg(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-cyan-200 border border-cyan-400/30 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>Change Vault PIN</span>
          </button>

          <button
            type="button"
            onClick={onToggleMotion}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 transition-colors"
          >
            {motionPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>Resume Spin</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Pause Spin</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPair(null);
              setDuplicateMode(false);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Pair</span>
          </button>
        </div>
      </div>

      {/* Inline Change Vault PIN Box */}
      {showPinEditor && (
        <form
          onSubmit={handleSavePinChange}
          className="rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-cyan-400/35 p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-xs text-cyan-200">
            <KeyRound className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Set a new 4-digit PIN for unlocking Sneaker Business Mode:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              aria-label="New 4-digit Vault PIN"
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 digits"
              className="w-28 rounded-lg bg-slate-950 border border-cyan-400/40 px-3 py-1.5 text-xs font-mono-nums text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-400 text-slate-950 hover:brightness-110"
            >
              Save PIN
            </button>
            {pinSavedMsg && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                {pinSavedMsg}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Urgent 4-Day Return Deadline Reminders */}
      {urgentReturnAlerts.length > 0 && (
        <section
          aria-label="4-Day Return Deadline Reminders"
          data-testid="return-deadline-alert-banner"
          className="rounded-2xl bg-rose-950/35 backdrop-blur-md border border-rose-400/50 p-4 space-y-2.5 shadow-[0_12px_40px_rgba(244,63,94,0.16)]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span className="font-display font-bold text-sm text-white">
                4-Day Return Deadline Alert ({urgentReturnAlerts.length}{' '}
                {urgentReturnAlerts.length === 1 ? 'pair' : 'pairs'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChangeTab('returned')}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2"
            >
              View Returned Shoes
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {urgentReturnAlerts.map(({ pair, alert }) => (
              <div
                key={pair.id}
                className="rounded-xl bg-slate-950/70 border border-rose-400/35 px-3 py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">
                    {pair.modelName} · Size {pair.size}
                  </div>
                  <div className="text-[11px] text-rose-200 font-mono-nums">
                    {alert.label} (Deadline: {alert.deadlineDate})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPair(pair);
                    setDuplicateMode(false);
                    setModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold shrink-0"
                >
                  Update
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editable Monthly Profit Goal Progress Bar */}
      <section
        aria-label="Monthly Profit Goal Tracker"
        className="hud-corners hud-emerald rounded-2xl bg-[#090D16]/85 backdrop-blur-md border border-emerald-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/25 to-amber-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                Monthly Profit Goal
              </div>
              <div className="font-mono-nums text-xs sm:text-sm font-bold text-emerald-300">
                ${profitGoalProgress.currentProfit.toFixed(0)} / $
                {profitGoalProgress.goal.toFixed(0)} Goal —{' '}
                <span className="text-amber-300">{profitGoalProgress.percent}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingGoal ? (
              <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5">
                <label htmlFor="monthly-goal-input" className="sr-only">
                  Monthly Profit Goal Amount
                </label>
                <input
                  id="monthly-goal-input"
                  type="number"
                  min="1"
                  step="1"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  className="w-24 rounded-lg bg-slate-950 border border-emerald-400/50 px-2.5 py-1 text-xs font-mono-nums text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-400 text-slate-950 hover:brightness-110"
                >
                  Save Goal
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGoal(false)}
                  className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setGoalDraft(String(monthlyProfitGoal));
                  setEditingGoal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-amber-200 border border-amber-400/30 transition-colors"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>Edit Goal</span>
              </button>
            )}
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={profitGoalProgress.clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly profit goal completion"
          className="h-2.5 w-full rounded-full bg-slate-950 border border-white/10 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300 transition-all duration-500"
            style={{ width: `${profitGoalProgress.clampedPercent}%` }}
          />
        </div>
      </section>

      {/* 5 Top Summary Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="hud-corners hud-cyan rounded-2xl bg-slate-900/60 backdrop-blur-md border border-cyan-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Total Revenue</div>
          <div className="font-mono-nums text-xl font-bold text-cyan-300 telemetry-glow-cyan mt-1">
            $<AnimatedNumber value={summary.totalRevenue} decimals={2} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.soldCount} sold {summary.soldCount === 1 ? 'pair' : 'pairs'}
          </div>
        </div>

        <div className="hud-corners hud-emerald rounded-2xl bg-slate-900/60 backdrop-blur-md border border-emerald-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Total Net Profit</div>
          <div
            className={`font-mono-nums text-xl font-bold mt-1 ${
              summary.totalNetProfit >= 0
                ? 'text-emerald-400 telemetry-glow-emerald'
                : 'text-rose-400 telemetry-glow-rose'
            }`}
          >
            {summary.totalNetProfit >= 0 ? '+' : '-'}$
            <AnimatedNumber value={Math.abs(summary.totalNetProfit)} decimals={2} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">After fees &amp; losses</div>
        </div>

        <div className="hud-corners hud-rose rounded-2xl bg-slate-900/60 backdrop-blur-md border border-rose-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Total Losses</div>
          <div className="font-mono-nums text-xl font-bold text-rose-400 telemetry-glow-rose mt-1">
            -$<AnimatedNumber value={summary.totalLosses} decimals={2} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.lossCount} loss {summary.lossCount === 1 ? 'pair' : 'pairs'}
          </div>
        </div>

        <div className="hud-corners hud-amber rounded-2xl bg-slate-900/60 backdrop-blur-md border border-amber-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Money Tied Up</div>
          <div className="font-mono-nums text-xl font-bold text-amber-300 telemetry-glow-amber mt-1">
            $<AnimatedNumber value={summary.moneyTiedUp} decimals={2} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In Hand stock cost</div>
        </div>

        <div className="col-span-2 md:col-span-1 hud-corners hud-cyan rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Active Inventory</div>
          <div className="font-mono-nums text-xl font-bold text-white mt-1">
            <AnimatedNumber value={summary.activeCount} /> pairs
          </div>
          <div className="text-[11px] text-cyan-300 font-mono-nums mt-1">
            Avg hold: {summary.avgHoldDays}d
          </div>
        </div>
      </section>

      {/* Visual Net Profit vs. Losses Chart */}
      <SneakerProfitChart sneakers={sneakers} />

      {/* Capital Tied Up vs Cash Freed + Model Family Grouping */}
      <section className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <DollarSign className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>
              Capital Tied Up:{' '}
              <strong className="font-mono-nums text-amber-300">
                ${summary.moneyTiedUp.toFixed(2)}
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Cash Freed (Sold Payouts):{' '}
              <strong className="font-mono-nums text-emerald-400">
                ${summary.cashFreed.toFixed(2)}
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Avg Hold Time:{' '}
              <strong className="font-mono-nums text-cyan-300">
                {summary.avgHoldDays} days
              </strong>
            </span>
          </div>
        </div>

        {/* Model Family Grouping Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {MODEL_FAMILIES.map((family) => {
            const stats = family === 'All' ? null : familyStats.get(family);
            const active = familyFilter === family;
            return (
              <button
                key={family}
                type="button"
                onClick={() => setFamilyFilter(family)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 shadow-sm'
                    : 'bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                }`}
              >
                {family === 'All'
                  ? `All Models (${sneakers.length})`
                  : `${family}${stats ? ` · $${stats.capital}` : ''}`}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter Tabs + Quick Search & Multi-Filter Bar */}
      <section className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950/75 border border-white/10">
            {(['All', 'In Hand', 'Sold', 'Returned', 'Loss'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onChangeTab(STATUS_TO_TAB[tab])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusTab === tab
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'Loss' ? 'Losses' : tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-[260px]">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search model or source..."
                aria-label="Search sneaker inventory"
                className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Market Price Quick-Check (StockX, GOAT, eBay Sold Listings) */}
            <div
              role="group"
              aria-label="Market Price Quick-Check"
              title={`Market Lookup: ${marketUrls.queryLabel}`}
              className="flex items-center gap-1"
            >
              <a
                href={marketUrls.stockx}
                target="_blank"
                rel="noopener noreferrer"
                title={`Check StockX prices for ${marketUrls.queryLabel}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-400/35 transition-colors whitespace-nowrap"
              >
                <span>StockX</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <a
                href={marketUrls.goat}
                target="_blank"
                rel="noopener noreferrer"
                title={`Check GOAT prices for ${marketUrls.queryLabel}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-400/35 transition-colors whitespace-nowrap"
              >
                <span>GOAT</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <a
                href={marketUrls.ebaySold}
                target="_blank"
                rel="noopener noreferrer"
                title={`Check eBay Sold Listings for ${marketUrls.queryLabel}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-400/35 transition-colors whitespace-nowrap"
              >
                <span>eBay Sold</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'All' | SneakerCategory)
              }
              className="rounded-xl bg-slate-950/80 border border-white/10 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="All">All Categories</option>
              <option value="Men's">Men&apos;s</option>
              <option value="Women's">Women&apos;s</option>
            </select>

            <select
              aria-label="Filter by size"
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-xl bg-slate-950/80 border border-white/10 px-2.5 py-1.5 text-xs font-mono-nums text-slate-200"
            >
              <option value="All">All Sizes</option>
              {SNEAKER_SIZES.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPairs.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No sneaker pairs match your active filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredPairs.map((pair) => renderPairCard(pair))}
          </div>
        )}
      </section>

      {/* Dedicated Returned Shoes Ledger */}
      <section
        aria-label="Returned Shoes Ledger"
        className="rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-amber-400/35 p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-300" aria-hidden="true" />
            <h2 className="font-display font-bold text-lg text-white">
              Returned Shoes Ledger
            </h2>
          </div>
          <div className="font-mono-nums text-sm font-bold text-amber-300">
            {returnedPairs.length} {returnedPairs.length === 1 ? 'pair' : 'pairs'} · 4-day return alerts active
          </div>
        </div>

        {returnedPairs.length === 0 ? (
          <p className="text-xs text-slate-400">
            No returned shoes logged yet. Mark a pair as Returned or set a Return Deadline when adding a shoe to trigger 4-day reminders.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {returnedPairs.map((pair) => renderPairCard(pair))}
          </div>
        )}
      </section>

      {/* Dedicated Losses Section at Bottom */}
      <section
        aria-label="Losses Ledger"
        className="rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-rose-500/35 p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" aria-hidden="true" />
            <h2 className="font-display font-bold text-lg text-white">
              Losses Ledger
            </h2>
          </div>
          <div className="font-mono-nums text-sm font-bold text-rose-400">
            Subtracted from Total Profit: -${summary.totalLosses.toFixed(2)}
          </div>
        </div>

        {lossPairs.length === 0 ? (
          <p className="text-xs text-slate-400">
            Zero losses logged. Marking a pair as Loss moves it here and deducts it from total net profit.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {lossPairs.map((pair) => renderPairCard(pair))}
          </div>
        )}
      </section>

      <PairFormModal
        open={modalOpen}
        initialPair={editingPair}
        defaultIsDuplicate={duplicateMode}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFromModal}
      />
    </div>
  );
};
