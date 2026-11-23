import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBreakEvenPrice,
  calculateTargetSellPrice,
  calculateNetProfit,
  calculateROI,
  computeInventorySummary,
  inferModelFamily,
  buildMarketLookupUrls,
  computeMonthlyProfitProgress,
  getReturnDeadlineAlert,
  inferBrandName,
  computeProfitTimeline,
} from './sneakerMath';
import { SneakerPair } from '../types/app';

test('break-even and +30% target sell price include platform fees accurately', () => {
  // Buy $80, Fee 8%: break-even = 80 / 0.92 = 86.96
  assert.equal(calculateBreakEvenPrice(80, 8), 86.96);
  // Target +30% net profit: desiredNet = 104; sell = 104 / 0.92 = 113.04
  assert.equal(calculateTargetSellPrice(80, 8, 30), 113.04);
  // 0% local cash fee: break-even = 80, target = 104
  assert.equal(calculateBreakEvenPrice(80, 0), 80);
  assert.equal(calculateTargetSellPrice(80, 0, 30), 104);
});

test('net profit and ROI calculate accurately for sold, loss, and returned pairs', () => {
  const soldPair: SneakerPair = {
    id: '1',
    modelName: 'Nike Dunk Low Panda',
    modelFamily: 'Dunk',
    category: "Men's",
    size: '10',
    condition: 'DS',
    status: 'Sold',
    buyPrice: 100,
    feePercent: 10,
    soldPrice: 160,
    purchaseDate: '2026-10-01',
    soldDate: '2026-10-15',
    sourceNote: 'Retail',
  };
  assert.equal(calculateNetProfit(soldPair), 44);
  assert.equal(calculateROI(44, 100), 44);

  const lossPair: SneakerPair = {
    id: '2',
    modelName: 'Air Jordan 4 Bred',
    modelFamily: 'Jordan 4',
    category: "Men's",
    size: '11',
    condition: 'Damaged Box',
    status: 'Loss',
    buyPrice: 200,
    feePercent: 0,
    soldPrice: 150,
    purchaseDate: '2026-10-01',
    soldDate: '2026-10-21',
    sourceNote: 'Local',
  };
  assert.equal(calculateNetProfit(lossPair), -50);

  const returnedPair: SneakerPair = {
    id: '3',
    modelName: 'Nike Dunk Low Grey Fog',
    modelFamily: 'Dunk',
    category: "Men's",
    size: '10',
    condition: 'DS',
    status: 'Returned',
    buyPrice: 115,
    feePercent: 0,
    purchaseDate: '2026-11-01',
    returnDeadline: '2026-11-25',
    sourceNote: 'Nike Store',
  };
  assert.equal(calculateNetProfit(returnedPair), 0);
});

test('inventory summary subtracts losses, excludes returned pairs from profit/capital, and computes hold time', () => {
  const pairs: SneakerPair[] = [
    {
      id: '1',
      modelName: 'Adidas Samba OG',
      modelFamily: 'Samba',
      category: "Men's",
      size: '9',
      condition: 'DS',
      status: 'In Hand',
      buyPrice: 80,
      feePercent: 8,
      purchaseDate: '2026-11-01',
      sourceNote: 'Drop',
    },
    {
      id: '2',
      modelName: 'Nike Dunk Low',
      modelFamily: 'Dunk',
      category: "Men's",
      size: '10',
      condition: 'DS',
      status: 'Sold',
      buyPrice: 100,
      feePercent: 10,
      soldPrice: 160,
      purchaseDate: '2026-11-01',
      soldDate: '2026-11-11',
      sourceNote: 'Drop',
    },
    {
      id: '3',
      modelName: 'Air Jordan 1 Chicago',
      modelFamily: 'Jordan 1',
      category: "Men's",
      size: '10.5',
      condition: 'No Lid',
      status: 'Loss',
      buyPrice: 180,
      feePercent: 0,
      soldPrice: 155,
      purchaseDate: '2026-11-01',
      soldDate: '2026-11-21',
      sourceNote: 'Outlet',
    },
    {
      id: '4',
      modelName: 'Nike Dunk Low Grey Fog',
      modelFamily: 'Dunk',
      category: "Men's",
      size: '10',
      condition: 'DS',
      status: 'Returned',
      buyPrice: 115,
      feePercent: 0,
      purchaseDate: '2026-11-01',
      returnDeadline: '2026-11-24',
      sourceNote: 'Nike Store',
    },
  ];

  const summary = computeInventorySummary(pairs, new Date('2026-11-22T00:00:00Z'));
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.returnedCount, 1);
  assert.equal(summary.moneyTiedUp, 80);
  assert.equal(summary.totalRevenue, 160);
  assert.equal(summary.totalLosses, 25);
  assert.equal(summary.totalNetProfit, 19);
  assert.equal(summary.avgHoldDays, 15);
  assert.equal(inferModelFamily('Adidas Handball Spezial'), 'Spezial');
});

test('getReturnDeadlineAlert triggers urgent 4-day warning within 4 days or overdue', () => {
  const now = new Date(2026, 10, 22, 10, 0, 0); // Nov 22, 2026
  const urgent4 = getReturnDeadlineAlert('2026-11-26', 'Returned', now);
  assert.equal(urgent4?.isUrgent, true);
  assert.equal(urgent4?.daysRemaining, 4);

  const urgentToday = getReturnDeadlineAlert('2026-11-22', 'In Hand', now);
  assert.equal(urgentToday?.isUrgent, true);
  assert.equal(urgentToday?.label, 'Return Due TODAY');

  const safe6 = getReturnDeadlineAlert('2026-11-28', 'In Hand', now);
  assert.equal(safe6?.isUrgent, false);
  assert.equal(safe6?.daysRemaining, 6);

  const soldIgnored = getReturnDeadlineAlert('2026-11-23', 'Sold', now);
  assert.equal(soldIgnored, null);
});

test('buildMarketLookupUrls generates pre-filled StockX, GOAT, and eBay Sold queries with size', () => {
  const urls = buildMarketLookupUrls('Air Jordan 1 Chicago', '10.5');
  assert.equal(urls.queryLabel, 'Air Jordan 1 Chicago size 10.5');
  assert.ok(urls.stockx.startsWith('https://stockx.com/search?s='));
  assert.ok(urls.goat.startsWith('https://www.goat.com/search?query='));
  assert.ok(urls.ebaySold.includes('LH_Sold=1'));
  assert.ok(urls.ebaySold.includes('10.5'));
});

test('computeMonthlyProfitProgress sums current month sold net profit against editable goal', () => {
  const pairs: SneakerPair[] = [
    {
      id: '1',
      modelName: 'Dunk Low',
      modelFamily: 'Dunk',
      category: "Men's",
      size: '10',
      condition: 'DS',
      status: 'Sold',
      buyPrice: 100,
      feePercent: 0,
      soldPrice: 420,
      purchaseDate: '2026-11-02',
      soldDate: '2026-11-12',
      sourceNote: 'Drop',
    },
    {
      id: '2',
      modelName: 'Old Month Pair',
      modelFamily: 'Samba',
      category: "Men's",
      size: '9',
      condition: 'DS',
      status: 'Sold',
      buyPrice: 80,
      feePercent: 0,
      soldPrice: 200,
      purchaseDate: '2026-10-02',
      soldDate: '2026-10-15',
      sourceNote: 'Retail',
    },
  ];
  const progress = computeMonthlyProfitProgress(pairs, 500, new Date('2026-11-22T12:00:00Z'));
  assert.equal(progress.currentProfit, 320);
  assert.equal(progress.goal, 500);
  assert.equal(progress.percent, 64);
  assert.equal(progress.clampedPercent, 64);
  assert.equal(progress.soldThisMonthCount, 1);
});

test('inferBrandName and computeProfitTimeline classify sneaker brands and track cumulative profit vs loss', () => {
  assert.equal(inferBrandName('Adidas Samba OG White'), 'Adidas');
  assert.equal(inferBrandName('Nike Dunk Low Panda'), 'Nike');
  assert.equal(inferBrandName('Air Jordan 4 Retro Bred'), 'Jordan');
  assert.equal(inferBrandName('New Balance 990v6 Grey'), 'New Balance');

  const pairs: SneakerPair[] = [
    {
      id: 'p1',
      modelName: 'Nike Dunk Low',
      modelFamily: 'Dunk',
      category: "Men's",
      size: '10',
      condition: 'DS',
      status: 'Sold',
      buyPrice: 100,
      feePercent: 10,
      soldPrice: 160,
      purchaseDate: '2026-11-01',
      soldDate: '2026-11-05',
      sourceNote: 'Drop',
    },
    {
      id: 'p2',
      modelName: 'Air Jordan 1',
      modelFamily: 'Jordan 1',
      category: "Men's",
      size: '11',
      condition: 'DS',
      status: 'Loss',
      buyPrice: 180,
      feePercent: 0,
      soldPrice: 150,
      purchaseDate: '2026-11-02',
      soldDate: '2026-11-10',
      sourceNote: 'Local',
    },
  ];

  const timeline = computeProfitTimeline(pairs);
  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].netDelta, 44);
  assert.equal(timeline[0].cumulativeNet, 44);
  assert.equal(timeline[1].netDelta, -30);
  assert.equal(timeline[1].cumulativeNet, 14);
});
