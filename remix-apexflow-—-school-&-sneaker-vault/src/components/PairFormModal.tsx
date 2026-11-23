import React, { useEffect, useState } from 'react';
import { X, DollarSign, Layers } from 'lucide-react';
import {
  SneakerCategory,
  SneakerCondition,
  SneakerPair,
  SneakerStatus,
} from '../types/app';
import {
  POPULAR_SNEAKER_MODELS,
  PRESET_SNEAKER_IMAGES,
  SNEAKER_SIZES,
  calculateBreakEvenPrice,
  calculateTargetSellPrice,
  getPresetImageForModel,
  inferModelFamily,
} from '../utils/sneakerMath';
import { SpinningShoe } from './SpinningShoe';

interface PairFormModalProps {
  open: boolean;
  initialPair: SneakerPair | null;
  defaultIsDuplicate?: boolean;
  onClose: () => void;
  onSave: (pairData: Omit<SneakerPair, 'id'>, existingId?: string) => void;
}

const FEE_PRESETS = [0, 3, 8, 12];

const CONDITION_OPTIONS: SneakerCondition[] = [
  'Deadstock / OG All',
  'VNDS / Tried On',
  'No Box Lid',
  'Used',
  'DS',
  'VNDS',
  'No Lid',
  'Damaged Box',
];

export const PairFormModal: React.FC<PairFormModalProps> = ({
  open,
  initialPair,
  defaultIsDuplicate = false,
  onClose,
  onSave,
}) => {
  const [modelName, setModelName] = useState('');
  const [category, setCategory] = useState<SneakerCategory>("Men's");
  const [size, setSize] = useState('10');
  const [condition, setCondition] = useState<SneakerCondition>('Deadstock / OG All');
  const [status, setStatus] = useState<SneakerStatus>('In Hand');
  const [feePercent, setFeePercent] = useState<number>(8);
  const [customFeeMode, setCustomFeeMode] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [returnDeadline, setReturnDeadline] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sku, setSku] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  // Bulk buy & split-order calculator state
  const [isBulk, setIsBulk] = useState(false);
  const [totalReceiptPrice, setTotalReceiptPrice] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState(2);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialPair) {
      setModelName(initialPair.modelName);
      setCategory(initialPair.category);
      setSize(initialPair.size);
      setCondition(initialPair.condition);
      setStatus(defaultIsDuplicate ? 'In Hand' : initialPair.status);
      setFeePercent(initialPair.feePercent);
      setCustomFeeMode(!FEE_PRESETS.includes(initialPair.feePercent));
      setBuyPrice(String(initialPair.buyPrice));
      setSoldPrice(
        defaultIsDuplicate || initialPair.soldPrice === undefined
          ? ''
          : String(initialPair.soldPrice)
      );
      setPurchaseDate(
        defaultIsDuplicate
          ? new Date().toISOString().slice(0, 10)
          : initialPair.purchaseDate
      );
      setReturnDeadline(
        defaultIsDuplicate ? '' : initialPair.returnDeadline || ''
      );
      setSourceNote(initialPair.sourceNote);
      setImageUrl(initialPair.imageUrl || '');
      setSku(initialPair.sku || '');
      setReceiptUrl(initialPair.receiptUrl || '');
    } else {
      setModelName('');
      setCategory("Men's");
      setSize('10');
      setCondition('Deadstock / OG All');
      setStatus('In Hand');
      setFeePercent(8);
      setCustomFeeMode(false);
      setBuyPrice('');
      setSoldPrice('');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setReturnDeadline('');
      setSourceNote('');
      setImageUrl('');
      setSku('');
      setReceiptUrl('');
      setIsBulk(false);
      setTotalReceiptPrice('');
      setBulkQuantity(2);
    }
    setError(null);
  }, [open, initialPair, defaultIsDuplicate]);

  if (!open) return null;

  // Compute effective buy price
  const computedBuyPrice = isBulk
    ? (Number(totalReceiptPrice) || 0) / Math.max(1, bulkQuantity)
    : Number(buyPrice) || 0;

  const breakEven = calculateBreakEvenPrice(computedBuyPrice, feePercent);
  const target30 = calculateTargetSellPrice(computedBuyPrice, feePercent, 30);

  const previewImg = imageUrl.trim() || getPresetImageForModel(modelName || 'Dunk');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) {
      setError('Model Name is required.');
      return;
    }
    if (isBulk) {
      const receiptTotal = Number(totalReceiptPrice);
      if (!Number.isFinite(receiptTotal) || receiptTotal <= 0) {
        setError('Enter a valid Total Receipt Price greater than $0.');
        return;
      }
    } else {
      if (!Number.isFinite(computedBuyPrice) || computedBuyPrice <= 0) {
        setError('Enter a valid Buy Price greater than $0.');
        return;
      }
    }

    const parsedSold = soldPrice.trim() ? Number(soldPrice) : undefined;
    if (status === 'Sold' && (!parsedSold || parsedSold <= 0)) {
      setError('Enter the Sold Price when status is Sold.');
      return;
    }

    const basePairData = {
      modelName: modelName.trim(),
      modelFamily: inferModelFamily(modelName.trim()),
      category,
      size,
      condition,
      status,
      buyPrice: Math.round((computedBuyPrice + Number.EPSILON) * 100) / 100,
      feePercent: Math.max(0, Math.min(95, Number(feePercent) || 0)),
      soldPrice: parsedSold,
      purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      soldDate:
        status === 'Sold' || status === 'Loss'
          ? initialPair?.soldDate || new Date().toISOString().slice(0, 10)
          : undefined,
      returnDeadline: returnDeadline.trim() || undefined,
      sourceNote: sourceNote.trim() || 'Retail Drop',
      imageUrl: imageUrl.trim() || getPresetImageForModel(modelName.trim()),
      sku: sku.trim() || undefined,
      receiptUrl: receiptUrl.trim() || undefined,
    };

    if (isBulk && !initialPair && bulkQuantity > 1) {
      // Add multiple pairs from bulk receipt
      for (let i = 0; i < bulkQuantity; i++) {
        onSave(basePairData);
      }
    } else {
      onSave(
        basePairData,
        initialPair && !defaultIsDuplicate ? initialPair.id : undefined
      );
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initialPair && !defaultIsDuplicate ? 'Edit Sneaker Pair' : 'Add Sneaker Pair'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-400/40 p-6 shadow-[0_24px_80px_rgba(16,185,129,0.2)] my-8">
        <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              {defaultIsDuplicate
                ? 'Add Another of This Shoe'
                : initialPair
                  ? 'Edit Pair Details'
                  : 'Add Pair to Inventory'}
            </h2>
            <p className="text-xs text-slate-400">
              Bulk split-order math · SKU lookup · Break-even &amp; +30% target helper
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pair form"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/35 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Bulk Buy / Multi-Pair Toggle Banner */}
          {!initialPair && (
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="text-xs font-display font-bold text-emerald-200">
                    Bulk Order / Multi-Pair Receipt Calculator
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBulk}
                    onChange={(e) => setIsBulk(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {isBulk && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="total-receipt-price" className="block text-xs text-slate-300 mb-1">
                      Total Receipt Price ($) (Tax &amp; discounts included)
                    </label>
                    <input
                      id="total-receipt-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalReceiptPrice}
                      onChange={(e) => setTotalReceiptPrice(e.target.value)}
                      placeholder="e.g. 320.00"
                      className="w-full rounded-lg bg-slate-950 border border-emerald-500/40 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="bulk-quantity" className="block text-xs text-slate-300 mb-1">
                      Quantity of Pairs (2 to 10)
                    </label>
                    <input
                      id="bulk-quantity"
                      type="number"
                      min="2"
                      max="10"
                      value={bulkQuantity}
                      onChange={(e) => setBulkQuantity(Math.max(2, Math.min(10, Number(e.target.value) || 2)))}
                      className="w-full rounded-lg bg-slate-950 border border-emerald-500/40 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="sm:col-span-2 text-xs text-emerald-300 font-mono-nums">
                    Calculated Per-Pair Buy Price: <strong>${computedBuyPrice.toFixed(2)}</strong> across {bulkQuantity} pairs
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Model Search / Autocomplete + Preview */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <SpinningShoe
              imageUrl={previewImg}
              modelName={modelName || 'Sneaker Preview'}
              size="lg"
            />
            <div className="flex-1 w-full space-y-3">
              <div>
                <label htmlFor="pair-model-name" className="block text-xs text-slate-300 mb-1">
                  Shoe Search / Model Name *
                </label>
                <input
                  id="pair-model-name"
                  list="popular-sneaker-models"
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. Adidas Samba OG, Handball Spezial, Nike Dunk Low..."
                  className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
                <datalist id="popular-sneaker-models">
                  {POPULAR_SNEAKER_MODELS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pair-sku" className="block text-xs text-slate-300 mb-1">
                    SKU / Style Code (Optional)
                  </label>
                  <input
                    id="pair-sku"
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. B75806 / HQ8707"
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-xs font-mono-nums text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label htmlFor="pair-receipt-url" className="block text-xs text-slate-300 mb-1">
                    Receipt / Photo Link (URL)
                  </label>
                  <input
                    id="pair-receipt-url"
                    type="text"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <div className="flex rounded-lg bg-[#090d16] border border-slate-700 p-0.5">
                {(["Men's", "Women's"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="pair-size" className="block text-xs text-slate-400 mb-1">
                Size (4–14)
              </label>
              <select
                id="pair-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-emerald-400"
              >
                {SNEAKER_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pair-condition" className="block text-xs text-slate-400 mb-1">
                Condition Tag
              </label>
              <select
                id="pair-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as SneakerCondition)}
                className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pair-status" className="block text-xs text-slate-400 mb-1">
                Status
              </label>
              <select
                id="pair-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SneakerStatus)}
                className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="In Hand">In Hand</option>
                <option value="Sold">Sold</option>
                <option value="Returned">Returned</option>
                <option value="Loss">Loss</option>
              </select>
            </div>
          </div>

          {/* Fee Presets & Pricing */}
          <div className="rounded-xl bg-[#090d16] border border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-300">
                Platform Fee Preset (for Profit &amp; Break-Even Estimate)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {FEE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setFeePercent(preset);
                      setCustomFeeMode(false);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono-nums border ${
                      !customFeeMode && feePercent === preset
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {preset === 0 ? '0% Local Cash' : `${preset}%`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomFeeMode(true)}
                  className={`px-2.5 py-1 rounded text-xs border ${
                    customFeeMode
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Custom %
                </button>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 gap-3 ${
                customFeeMode ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
              }`}
            >
              {!isBulk && (
                <div>
                  <label htmlFor="pair-buy-price" className="block text-xs text-slate-400 mb-1">
                    Buy Price ($) *
                  </label>
                  <input
                    id="pair-buy-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="80.00"
                    className="w-full rounded-lg bg-[#0f1624] border border-slate-700 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}

              {customFeeMode && (
                <div>
                  <label htmlFor="pair-custom-fee" className="block text-xs text-slate-400 mb-1">
                    Custom Fee (%)
                  </label>
                  <input
                    id="pair-custom-fee"
                    type="number"
                    step="0.5"
                    min="0"
                    max="95"
                    value={feePercent}
                    onChange={(e) => setFeePercent(Number(e.target.value) || 0)}
                    className="w-full rounded-lg bg-[#0f1624] border border-slate-700 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div className={isBulk ? 'sm:col-span-2' : ''}>
                <label htmlFor="pair-sold-price" className="block text-xs text-slate-400 mb-1">
                  Sold / Recovery Price ($)
                </label>
                <input
                  id="pair-sold-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  placeholder={status === 'In Hand' ? 'Optional until sold' : '145.00'}
                  className="w-full rounded-lg bg-[#0f1624] border border-slate-700 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Live Break-Even & Target Price Helper */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>
                  Break-Even ({feePercent}% fee):{' '}
                  <strong className="font-mono-nums text-cyan-300">
                    ${breakEven.toFixed(2)}
                  </strong>
                </span>
              </div>
              <div className="text-slate-300">
                Suggested Target (+30% net):{' '}
                <strong className="font-mono-nums text-emerald-400">
                  ${target30.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label htmlFor="pair-date" className="block text-xs text-slate-400 mb-1">
                Purchase Date
              </label>
              <input
                id="pair-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label htmlFor="pair-return-deadline" className="block text-xs text-amber-300 mb-1">
                Return Deadline (4d Alert)
              </label>
              <input
                id="pair-return-deadline"
                type="date"
                value={returnDeadline}
                onChange={(e) => setReturnDeadline(e.target.value)}
                className="w-full rounded-lg bg-[#090d16] border border-amber-500/40 px-3 py-2 text-sm font-mono-nums text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label htmlFor="pair-source" className="block text-xs text-slate-400 mb-1">
                Source Note
              </label>
              <input
                id="pair-source"
                type="text"
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder="e.g. Outlet, SNKRS, Friend"
                className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              {initialPair && !defaultIsDuplicate ? 'Save Changes' : isBulk && bulkQuantity > 1 ? `Add ${bulkQuantity} Pairs` : 'Save Pair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
