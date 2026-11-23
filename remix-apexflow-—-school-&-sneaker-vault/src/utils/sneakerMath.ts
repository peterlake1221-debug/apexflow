import { ModelFamily, SneakerPair, SneakerStatus } from '../types/app';

export const PRESET_SNEAKER_IMAGES: Record<Exclude<ModelFamily, 'Other'>, string> = {
  Samba: '/src/assets/images/sneaker_samba_1795359701914.jpg',
  Spezial: '/src/assets/images/sneaker_spezial_1795359702094.jpg',
  Dunk: '/src/assets/images/sneaker_dunk_1795359702426.jpg',
  'Jordan 1': '/src/assets/images/sneaker_jordan1_1795359702304.jpg',
  'Jordan 4': '/src/assets/images/sneaker_jordan4_1795359701650.jpg',
};

export const POPULAR_SNEAKER_MODELS: string[] = [
  'Adidas Samba OG Cloud White / Core Black',
  'Adidas Handball Spezial Collegiate Navy',
  'Nike Dunk Low Panda Black / White',
  'Air Jordan 1 Retro High OG Chicago',
  'Air Jordan 4 Retro Bred Reimagined',
  'Adidas Samba Classic Gum',
  'Adidas Handball Spezial Light Blue',
  'Nike Dunk Low Grey Fog',
  'Air Jordan 1 Retro Low OG Mocha',
  'Air Jordan 4 Retro Military Blue',
];

export const SNEAKER_SIZES: string[] = [
  '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5',
  '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14',
];

export function inferModelFamily(modelName: string): ModelFamily {
  const lower = modelName.toLowerCase();
  if (lower.includes('samba')) return 'Samba';
  if (lower.includes('spezial')) return 'Spezial';
  if (lower.includes('dunk')) return 'Dunk';
  if (lower.includes('jordan 1') || lower.includes('aj1')) return 'Jordan 1';
  if (lower.includes('jordan 4') || lower.includes('aj4')) return 'Jordan 4';
  return 'Other';
}

export function getPresetImageForModel(modelName: string): string {
  const family = inferModelFamily(modelName);
  if (family === 'Other') {
    return PRESET_SNEAKER_IMAGES.Dunk;
  }
  return PRESET_SNEAKER_IMAGES[family];
}

export function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateFeeAmount(soldPrice: number, feePercent: number): number {
  if (!Number.isFinite(soldPrice) || soldPrice <= 0) return 0;
  const clampedFee = Math.max(0, Math.min(99.9, feePercent || 0));
  return roundMoney(soldPrice * (clampedFee / 100));
}

export function calculateBreakEvenPrice(buyPrice: number, feePercent: number): number {
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) return 0;
  const clampedFee = Math.max(0, Math.min(95, feePercent || 0));
  return roundMoney(buyPrice / (1 - clampedFee / 100));
}

export function calculateTargetSellPrice(
  buyPrice: number,
  feePercent: number,
  targetProfitPct = 30
): number {
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) return 0;
  const clampedFee = Math.max(0, Math.min(95, feePercent || 0));
  const desiredNet = buyPrice * (1 + targetProfitPct / 100);
  return roundMoney(desiredNet / (1 - clampedFee / 100));
}

export function calculateNetProfit(
  pair: Pick<SneakerPair, 'status' | 'buyPrice' | 'soldPrice' | 'feePercent'>
): number {
  if (pair.status === 'In Hand' || pair.status === 'Returned') {
    return 0;
  }
  if (pair.status === 'Loss') {
    const recovered =
      pair.soldPrice && pair.soldPrice > 0
        ? pair.soldPrice - calculateFeeAmount(pair.soldPrice, pair.feePercent)
        : 0;
    return roundMoney(recovered - pair.buyPrice);
  }
  const sold = pair.soldPrice ?? 0;
  const fees = calculateFeeAmount(sold, pair.feePercent);
  return roundMoney(sold - fees - pair.buyPrice);
}

export function calculateROI(netProfit: number, buyPrice: number): number {
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) return 0;
  return Math.round(((netProfit / buyPrice) * 100) * 10) / 10;
}

export function calculateDaysHeld(
  purchaseDate: string,
  endDate?: string,
  nowDate: Date = new Date()
): number {
  const start = new Date(purchaseDate);
  if (Number.isNaN(start.getTime())) return 0;
  const end = endDate ? new Date(endDate) : nowDate;
  if (Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export interface ReturnDeadlineAlert {
  deadlineDate: string;
  daysRemaining: number;
  isUrgent: boolean;
  severity: 'overdue' | 'urgent' | 'upcoming';
  label: string;
}

export function getReturnDeadlineAlert(
  returnDeadline?: string,
  status?: SneakerStatus,
  nowDate: Date = new Date()
): ReturnDeadlineAlert | null {
  if (!returnDeadline || !/^\d{4}-\d{2}-\d{2}$/.test(returnDeadline.trim())) {
    return null;
  }
  if (status === 'Sold' || status === 'Loss') {
    return null;
  }

  const [y, m, d] = returnDeadline.trim().split('-').map(Number);
  const deadlineUtc = Date.UTC(y, m - 1, d);
  const nowUtc = Date.UTC(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate()
  );
  const daysRemaining = Math.round((deadlineUtc - nowUtc) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const ago = Math.abs(daysRemaining);
    return {
      deadlineDate: returnDeadline.trim(),
      daysRemaining,
      isUrgent: true,
      severity: 'overdue',
      label: `Return overdue by ${ago}d`,
    };
  }

  if (daysRemaining === 0) {
    return {
      deadlineDate: returnDeadline.trim(),
      daysRemaining: 0,
      isUrgent: true,
      severity: 'urgent',
      label: 'Return Due TODAY',
    };
  }

  if (daysRemaining <= 4) {
    return {
      deadlineDate: returnDeadline.trim(),
      daysRemaining,
      isUrgent: true,
      severity: 'urgent',
      label: `${daysRemaining}d left to return`,
    };
  }

  return {
    deadlineDate: returnDeadline.trim(),
    daysRemaining,
    isUrgent: false,
    severity: 'upcoming',
    label: `Return by ${returnDeadline.trim()} (${daysRemaining}d left)`,
  };
}

export interface InventorySummaryMetrics {
  totalRevenue: number;
  totalNetProfit: number;
  totalLosses: number;
  moneyTiedUp: number;
  cashFreed: number;
  activeCount: number;
  soldCount: number;
  returnedCount: number;
  lossCount: number;
  avgHoldDays: number;
}

export function computeInventorySummary(
  pairs: SneakerPair[],
  nowDate: Date = new Date()
): InventorySummaryMetrics {
  let totalRevenue = 0;
  let soldProfitSum = 0;
  let totalLosses = 0;
  let moneyTiedUp = 0;
  let cashFreed = 0;
  let activeCount = 0;
  let soldCount = 0;
  let returnedCount = 0;
  let lossCount = 0;
  let holdDaysSum = 0;
  let holdDaysCount = 0;

  for (const pair of pairs) {
    if (pair.status === 'In Hand') {
      activeCount += 1;
      moneyTiedUp += pair.buyPrice;
    } else if (pair.status === 'Returned') {
      returnedCount += 1;
    } else if (pair.status === 'Sold') {
      soldCount += 1;
      const sold = pair.soldPrice ?? 0;
      const fees = calculateFeeAmount(sold, pair.feePercent);
      const net = calculateNetProfit(pair);
      totalRevenue += sold;
      cashFreed += Math.max(0, sold - fees);
      soldProfitSum += net;
      holdDaysSum += calculateDaysHeld(pair.purchaseDate, pair.soldDate, nowDate);
      holdDaysCount += 1;
    } else if (pair.status === 'Loss') {
      lossCount += 1;
      const netLoss = calculateNetProfit(pair);
      totalLosses += Math.abs(Math.min(0, netLoss));
      if (pair.soldPrice && pair.soldPrice > 0) {
        const fees = calculateFeeAmount(pair.soldPrice, pair.feePercent);
        cashFreed += Math.max(0, pair.soldPrice - fees);
      }
      holdDaysSum += calculateDaysHeld(pair.purchaseDate, pair.soldDate, nowDate);
      holdDaysCount += 1;
    }
  }

  const totalNetProfit = roundMoney(soldProfitSum - totalLosses);
  const avgHoldDays = holdDaysCount > 0 ? Math.round(holdDaysSum / holdDaysCount) : 0;

  return {
    totalRevenue: roundMoney(totalRevenue),
    totalNetProfit,
    totalLosses: roundMoney(totalLosses),
    moneyTiedUp: roundMoney(moneyTiedUp),
    cashFreed: roundMoney(cashFreed),
    activeCount,
    soldCount,
    returnedCount,
    lossCount,
    avgHoldDays,
  };
}

export interface MarketLookupUrls {
  queryLabel: string;
  stockx: string;
  goat: string;
  ebaySold: string;
}

export function buildMarketLookupUrls(modelName: string, size?: string): MarketLookupUrls {
  const cleanModel = modelName.trim() || 'Sneakers';
  const cleanSize = size && size !== 'All' ? size.trim() : '';
  const combined = cleanSize ? `${cleanModel} size ${cleanSize}` : cleanModel;
  const encoded = encodeURIComponent(combined);

  return {
    queryLabel: combined,
    stockx: `https://stockx.com/search?s=${encoded}`,
    goat: `https://www.goat.com/search?query=${encoded}`,
    ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Sold=1&LH_Complete=1`,
  };
}

export interface MonthlyProfitProgress {
  currentProfit: number;
  goal: number;
  percent: number;
  clampedPercent: number;
  soldThisMonthCount: number;
}

export function computeMonthlyProfitProgress(
  pairs: SneakerPair[],
  goal: number,
  nowDate: Date = new Date()
): MonthlyProfitProgress {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? roundMoney(goal) : 500;
  const monthPrefix = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;

  let currentProfit = 0;
  let soldThisMonthCount = 0;

  for (const pair of pairs) {
    if (pair.status !== 'Sold') continue;
    const dateRef = pair.soldDate || pair.purchaseDate;
    if (dateRef && !dateRef.startsWith(monthPrefix)) continue;
    soldThisMonthCount += 1;
    currentProfit += calculateNetProfit(pair);
  }

  const roundedProfit = roundMoney(currentProfit);
  const rawPercent = Math.round((roundedProfit / safeGoal) * 100);
  const percent = Math.max(0, rawPercent);
  const clampedPercent = Math.min(100, percent);

  return {
    currentProfit: roundedProfit,
    goal: safeGoal,
    percent,
    clampedPercent,
    soldThisMonthCount,
  };
}

export function inferBrandName(
  modelName: string
): 'Adidas' | 'Nike' | 'Jordan' | 'New Balance' | 'Sneaker' {
  const lower = modelName.toLowerCase();
  if (lower.includes('jordan') || lower.includes('aj1') || lower.includes('aj4')) {
    return 'Jordan';
  }
  if (lower.includes('adidas') || lower.includes('samba') || lower.includes('spezial') || lower.includes('yeezy')) {
    return 'Adidas';
  }
  if (lower.includes('new balance') || /\bnb\s*\d/.test(lower)) {
    return 'New Balance';
  }
  if (lower.includes('nike') || lower.includes('dunk') || lower.includes('air max') || lower.includes('air force')) {
    return 'Nike';
  }
  return 'Sneaker';
}

export interface ProfitTimelinePoint {
  id: string;
  date: string;
  label: string;
  modelName: string;
  status: 'Sold' | 'Loss';
  netDelta: number;
  cumulativeNet: number;
}

export function computeProfitTimeline(pairs: SneakerPair[]): ProfitTimelinePoint[] {
  const closed = pairs
    .filter((p) => p.status === 'Sold' || p.status === 'Loss')
    .slice()
    .sort((a, b) => {
      const da = a.soldDate || a.purchaseDate || '';
      const db = b.soldDate || b.purchaseDate || '';
      return da.localeCompare(db);
    });

  let running = 0;
  return closed.map((pair) => {
    const netDelta = calculateNetProfit(pair);
    running = roundMoney(running + netDelta);
    const refDate = pair.soldDate || pair.purchaseDate;
    const shortDate = /^\d{4}-\d{2}-\d{2}$/.test(refDate) ? refDate.slice(5) : refDate;
    return {
      id: pair.id,
      date: refDate,
      label: shortDate,
      modelName: pair.modelName,
      status: pair.status as 'Sold' | 'Loss',
      netDelta,
      cumulativeNet: running,
    };
  });
}
