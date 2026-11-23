import {
  AssignmentTask,
  CityLandmarkId,
  CityLevel,
  StudyCityState,
} from '../types/app';
import { getTaskUrgency, toLocalDateKey } from './studyAndGrades';

export interface CityTierConfig {
  level: CityLevel;
  title: string;
  subtitle: string;
  minBlueprints: number;
  mayorRank: string;
  population: number;
  landmarkId: Exclude<CityLandmarkId, 'trophy-monument'>;
}

export const CITY_TIERS: CityTierConfig[] = [
  {
    level: 1,
    title: 'Small Cabin & Dirt Roads',
    subtitle: 'Foundational focus block camp with dirt paths and workshop timber',
    minBlueprints: 0,
    mayorRank: 'Town Founder',
    population: 120,
    landmarkId: 'cabin',
  },
  {
    level: 2,
    title: 'Townhouses & Study Café',
    subtitle: 'Warm brick storefronts, cobblestone lanes, and late-night espresso',
    minBlueprints: 200,
    mayorRank: 'Block Captain',
    population: 1450,
    landmarkId: 'cafe',
  },
  {
    level: 3,
    title: 'High-Rise Apartments & Tech Library',
    subtitle: 'Glass reading halls, fiber-optic study towers, and residential skylines',
    minBlueprints: 500,
    mayorRank: 'District Architect',
    population: 12800,
    landmarkId: 'library',
  },
  {
    level: 4,
    title: 'Neon Skyscrapers & Sneaker Flagship Store',
    subtitle: 'Illuminated downtown skyscrapers anchored by your flagship Sneaker Vault store',
    minBlueprints: 900,
    mayorRank: 'Metro Commissioner',
    population: 84500,
    landmarkId: 'sneaker-store',
  },
  {
    level: 5,
    title: 'Championship Soccer Stadium & Futuristic Megacity',
    subtitle: 'Floodlit Bernabéu-inspired soccer arena towering inside a neon megacity',
    minBlueprints: 1400,
    mayorRank: 'Grand Mayor',
    population: 420000,
    landmarkId: 'stadium',
  },
];

export interface CityBuildingMilestone {
  id: CityLandmarkId;
  name: string;
  requiredLevel: number;
  unlockCondition: string;
  description: string;
  isSpecial?: boolean;
}

export const CITY_BUILDING_MILESTONES: CityBuildingMilestone[] = [
  {
    id: 'cabin',
    name: 'Small Cabin & Dirt Roads',
    requiredLevel: 1,
    unlockCondition: 'Starter Tier (Lv. 1 · 0 Blueprints)',
    description: 'Your first quiet timber study cabin at the edge of town.',
  },
  {
    id: 'cafe',
    name: 'Townhouses & Study Café',
    requiredLevel: 2,
    unlockCondition: 'Reach City Lv. 2 (200 Blueprints)',
    description: 'Cozy study café with warm awning lights and neighborhood townhouses.',
  },
  {
    id: 'library',
    name: 'High-Rise Apartments & Tech Library',
    requiredLevel: 3,
    unlockCondition: 'Reach City Lv. 3 (500 Blueprints)',
    description: 'Multi-story digital library and mid-rise apartments powered by focus streaks.',
  },
  {
    id: 'sneaker-store',
    name: 'Neon Skyscrapers & Sneaker Flagship Store',
    requiredLevel: 4,
    unlockCondition: 'Reach City Lv. 4 (900 Blueprints)',
    description: 'Flagship sneaker showroom glowing beside cyan & indigo high-rises.',
  },
  {
    id: 'stadium',
    name: 'Championship Soccer Stadium & Megacity',
    requiredLevel: 5,
    unlockCondition: 'Reach City Lv. 5 (1,400 Blueprints)',
    description: 'World-class floodlit stadium crowning Ghirmay’s futuristic skyline.',
  },
  {
    id: 'trophy-monument',
    name: 'Championship Trophy Monument',
    requiredLevel: 1,
    unlockCondition: 'Defeat an Exam Boss in Boss Battle Mode',
    description: 'Permanent golden championship spire honoring a 45-minute Boss Exam victory.',
    isSpecial: true,
  },
];

export function getIsoWeekKey(date: Date = new Date()): string {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function computeCityLevelFromBlueprints(blueprints: number): CityLevel {
  const safe = Math.max(0, blueprints);
  let level: CityLevel = 1;
  for (const tier of CITY_TIERS) {
    if (safe >= tier.minBlueprints) {
      level = tier.level;
    }
  }
  return level;
}

export function getUnlockedLandmarksForState(
  level: CityLevel,
  championshipTrophyUnlocked: boolean
): CityLandmarkId[] {
  const list: CityLandmarkId[] = [];
  for (const tier of CITY_TIERS) {
    if (level >= tier.level) {
      list.push(tier.landmarkId);
    }
  }
  if (championshipTrophyUnlocked) {
    list.push('trophy-monument');
  }
  return list;
}

export function getCityTierConfig(level: CityLevel): CityTierConfig {
  return CITY_TIERS.find((t) => t.level === level) || CITY_TIERS[0];
}

export function getNextCityTierProgress(blueprints: number): {
  currentTier: CityTierConfig;
  nextTier: CityTierConfig | null;
  progressPercent: number;
  blueprintsToNext: number;
} {
  const currentLevel = computeCityLevelFromBlueprints(blueprints);
  const currentTier = getCityTierConfig(currentLevel);
  const nextTier = CITY_TIERS.find((t) => t.level === currentLevel + 1) || null;
  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      blueprintsToNext: 0,
    };
  }
  const span = Math.max(1, nextTier.minBlueprints - currentTier.minBlueprints);
  const intoTier = Math.max(0, blueprints - currentTier.minBlueprints);
  return {
    currentTier,
    nextTier,
    progressPercent: Math.min(100, Math.round((intoTier / span) * 100)),
    blueprintsToNext: Math.max(0, nextTier.minBlueprints - blueprints),
  };
}

export function normalizeCityPeriod(
  city: StudyCityState,
  now: Date = new Date()
): StudyCityState {
  const todayKey = toLocalDateKey(now);
  const weekKey = getIsoWeekKey(now);
  let next = city;
  if (city.lastQuestDate !== todayKey) {
    next = {
      ...next,
      completedFocusToday: 0,
      completedUrgentTasks: 0,
      lastQuestDate: todayKey,
    };
  }
  if (city.lastQuestWeek !== weekKey) {
    next = {
      ...next,
      highScoreQuizzes: 0,
      lastQuestWeek: weekKey,
    };
  }
  return next;
}

export interface CityEnvironment {
  skyPhase: 'morning' | 'day' | 'sunset' | 'night';
  skyLabel: string;
  windowsLit: boolean;
  weather: 'sunny' | 'rain';
  weatherLabel: string;
  bonusXpMultiplier: number;
  overdueCount: number;
}

export function getCityEnvironment(
  tasks: AssignmentTask[],
  now: Date = new Date()
): CityEnvironment {
  const hour = now.getHours();
  let skyPhase: CityEnvironment['skyPhase'] = 'day';
  let skyLabel = 'Bright Daylight';
  let windowsLit = false;

  if (hour >= 6 && hour < 11) {
    skyPhase = 'morning';
    skyLabel = 'Crisp Morning Sky';
  } else if (hour >= 11 && hour < 17) {
    skyPhase = 'day';
    skyLabel = 'Clear Afternoon Sky';
  } else if (hour >= 17 && hour < 20) {
    skyPhase = 'sunset';
    skyLabel = 'Golden Sunset Glow';
    windowsLit = true;
  } else {
    skyPhase = 'night';
    skyLabel = 'Neon Night Skyline';
    windowsLit = true;
  }

  const overdueCount = tasks.filter(
    (t) => getTaskUrgency(t.dueDate, t.status, now) === 'overdue'
  ).length;

  const weather = overdueCount === 0 ? 'sunny' : 'rain';
  const bonusXpMultiplier = weather === 'sunny' ? 1.1 : 1;
  const weatherLabel =
    weather === 'sunny'
      ? 'Clear Sunny Skies (+10% Bonus XP)'
      : `Rain Clouds (${overdueCount} Overdue Canvas Task${overdueCount === 1 ? '' : 's'})`;

  return {
    skyPhase,
    skyLabel,
    windowsLit,
    weather,
    weatherLabel,
    bonusXpMultiplier,
    overdueCount,
  };
}

export interface StudyQuestDefinition {
  id: 'daily-focus-2' | 'daily-urgent-task' | 'weekly-quiz-80';
  cadence: 'Daily' | 'Weekly';
  title: string;
  description: string;
  target: number;
  current: number;
  rewardType: 'bricks' | 'blueprints';
  rewardAmount: number;
  periodKey: string;
  claimed: boolean;
  canClaim: boolean;
}

export function computeStudyQuests(
  rawCity: StudyCityState,
  now: Date = new Date()
): StudyQuestDefinition[] {
  const city = normalizeCityPeriod(rawCity, now);
  const todayKey = toLocalDateKey(now);
  const weekKey = getIsoWeekKey(now);

  const q1Current = Math.min(2, city.completedFocusToday || 0);
  const q1Claimed = city.claimedQuests['daily-focus-2'] === todayKey;

  const q2Current = Math.min(1, city.completedUrgentTasks || 0);
  const q2Claimed = city.claimedQuests['daily-urgent-task'] === todayKey;

  const q3Current = Math.min(1, city.highScoreQuizzes || 0);
  const q3Claimed = city.claimedQuests['weekly-quiz-80'] === weekKey;

  return [
    {
      id: 'daily-focus-2',
      cadence: 'Daily',
      title: 'Complete 2 Pomodoro focus blocks',
      description: 'Finish two uninterrupted focus sessions to supply town builders.',
      target: 2,
      current: q1Current,
      rewardType: 'bricks',
      rewardAmount: 150,
      periodKey: todayKey,
      claimed: q1Claimed,
      canClaim: q1Current >= 2 && !q1Claimed,
    },
    {
      id: 'daily-urgent-task',
      cadence: 'Daily',
      title: 'Finish 1 due-today or overdue Canvas assignment',
      description: 'Mark a due-today or overdue assignment Done on your Homework Board.',
      target: 1,
      current: q2Current,
      rewardType: 'blueprints',
      rewardAmount: 200,
      periodKey: todayKey,
      claimed: q2Claimed,
      canClaim: q2Current >= 1 && !q2Claimed,
    },
    {
      id: 'weekly-quiz-80',
      cadence: 'Weekly',
      title: 'Score 80% or higher on a Gizmo/Thea flashcard quiz',
      description: 'Ace a Practice Test in the AI Study Hub with >= 80% accuracy.',
      target: 1,
      current: q3Current,
      rewardType: 'bricks',
      rewardAmount: 100,
      periodKey: weekKey,
      claimed: q3Claimed,
      canClaim: q3Current >= 1 && !q3Claimed,
    },
  ];
}

export function awardCityFocusCompletion(
  rawCity: StudyCityState,
  minutes: number,
  bonusMultiplier: number,
  now: Date = new Date()
): StudyCityState {
  const city = normalizeCityPeriod(rawCity, now);
  const gainedBricks = Math.round(75 * bonusMultiplier);
  const gainedBlueprints = Math.round(50 * bonusMultiplier);
  const nextBlueprints = city.blueprints + gainedBlueprints;
  const nextLevel = computeCityLevelFromBlueprints(nextBlueprints);

  return {
    ...city,
    bricks: city.bricks + gainedBricks,
    blueprints: nextBlueprints,
    level: nextLevel,
    totalStudyMinutes: city.totalStudyMinutes + Math.max(1, Math.round(minutes)),
    completedFocusToday: city.completedFocusToday + 1,
    unlockedLandmarks: getUnlockedLandmarksForState(
      nextLevel,
      city.championshipTrophyUnlocked
    ),
  };
}

export function recordUrgentTaskCompletionForCity(
  rawCity: StudyCityState,
  now: Date = new Date()
): StudyCityState {
  const city = normalizeCityPeriod(rawCity, now);
  return {
    ...city,
    completedUrgentTasks: city.completedUrgentTasks + 1,
  };
}

export function recordHighScoreQuizForCity(
  rawCity: StudyCityState,
  scorePercent: number,
  now: Date = new Date()
): StudyCityState {
  const city = normalizeCityPeriod(rawCity, now);
  if (scorePercent < 80) return city;
  return {
    ...city,
    highScoreQuizzes: city.highScoreQuizzes + 1,
  };
}

export function claimCityQuestReward(
  rawCity: StudyCityState,
  questId: StudyQuestDefinition['id'],
  now: Date = new Date()
): { nextCity: StudyCityState; awarded: boolean; bricksAdded: number; blueprintsAdded: number } {
  const city = normalizeCityPeriod(rawCity, now);
  const quests = computeStudyQuests(city, now);
  const target = quests.find((q) => q.id === questId);
  if (!target || !target.canClaim) {
    return { nextCity: city, awarded: false, bricksAdded: 0, blueprintsAdded: 0 };
  }

  const bricksAdded = target.rewardType === 'bricks' ? target.rewardAmount : 0;
  const blueprintsAdded = target.rewardType === 'blueprints' ? target.rewardAmount : 0;
  const nextBlueprints = city.blueprints + blueprintsAdded;
  const nextLevel = computeCityLevelFromBlueprints(nextBlueprints);

  return {
    awarded: true,
    bricksAdded,
    blueprintsAdded,
    nextCity: {
      ...city,
      bricks: city.bricks + bricksAdded,
      blueprints: nextBlueprints,
      level: nextLevel,
      unlockedLandmarks: getUnlockedLandmarksForState(
        nextLevel,
        city.championshipTrophyUnlocked
      ),
      claimedQuests: {
        ...city.claimedQuests,
        [questId]: target.periodKey,
      },
    },
  };
}

export function awardBossBattleVictory(
  rawCity: StudyCityState,
  bonusMultiplier: number,
  minutesStudied = 45,
  now: Date = new Date()
): StudyCityState {
  const city = normalizeCityPeriod(rawCity, now);
  const bricksGain = Math.round(200 * bonusMultiplier);
  const blueprintsGain = Math.round(250 * bonusMultiplier);
  const nextBlueprints = city.blueprints + blueprintsGain;
  const nextLevel = computeCityLevelFromBlueprints(nextBlueprints);

  return {
    ...city,
    bricks: city.bricks + bricksGain,
    blueprints: nextBlueprints,
    level: nextLevel,
    totalStudyMinutes: city.totalStudyMinutes + minutesStudied,
    championshipTrophyUnlocked: true,
    bossBattlesWon: (city.bossBattlesWon || 0) + 1,
    completedFocusToday: city.completedFocusToday + 1,
    unlockedLandmarks: getUnlockedLandmarksForState(nextLevel, true),
  };
}

export function createInitialStudyCity(
  legacyXp = 120,
  legacyPomodoros = 2,
  now: Date = new Date()
): StudyCityState {
  const blueprints = Math.max(0, legacyXp);
  const level = computeCityLevelFromBlueprints(blueprints);
  return {
    bricks: Math.max(120, legacyPomodoros * 75),
    blueprints,
    level,
    totalStudyMinutes: legacyPomodoros * 25,
    unlockedLandmarks: getUnlockedLandmarksForState(level, false),
    championshipTrophyUnlocked: false,
    bossBattlesWon: 0,
    completedFocusToday: 0,
    completedUrgentTasks: 0,
    highScoreQuizzes: 0,
    lastQuestDate: toLocalDateKey(now),
    lastQuestWeek: getIsoWeekKey(now),
    claimedQuests: {},
  };
}
