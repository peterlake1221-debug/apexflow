import {
  AssignmentTask,
  CityLandmarkId,
  CourseGrade,
  PersistedAppState,
  SoleThemeColor,
  StudyProgressStats,
  UpgradeIdeaItem,
} from '../types/app';
import {
  computeCityLevelFromBlueprints,
  createInitialStudyCity,
  getIsoWeekKey,
  getUnlockedLandmarksForState,
} from './cityAndQuests';
import { normalizeHexColor } from './themeUtils';

export type TaskUrgency = 'overdue' | 'due-today' | 'upcoming' | 'done';

export const DEV_STUDIO_PIN = '1248';

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getTaskUrgency(
  dueDateIso: string,
  status: AssignmentTask['status'],
  now: Date = new Date()
): TaskUrgency {
  if (status === 'Done') return 'done';
  const due = new Date(dueDateIso);
  if (Number.isNaN(due.getTime())) return 'upcoming';

  if (due.getTime() < now.getTime()) {
    return isSameLocalDay(due, now) ? 'due-today' : 'overdue';
  }
  if (isSameLocalDay(due, now)) {
    return 'due-today';
  }
  return 'upcoming';
}

export function formatCountdownLabel(dueDateIso: string, now: Date = new Date()): string {
  const due = new Date(dueDateIso);
  if (Number.isNaN(due.getTime())) return 'Invalid date';

  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) {
    const overdueHours = Math.max(1, Math.round(Math.abs(diffMs) / (1000 * 60 * 60)));
    return overdueHours >= 24
      ? `Overdue by ${Math.floor(overdueHours / 24)}d`
      : `Overdue by ${overdueHours}h`;
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (totalHours < 1) {
    return `Due in ${Math.max(1, totalMinutes)} min`;
  }
  if (totalHours < 24) {
    return `Due in ${totalHours} ${totalHours === 1 ? 'hour' : 'hours'}`;
  }
  const remHours = totalHours % 24;
  return remHours > 0 ? `Due in ${days}d ${remHours}h` : `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function getNextUpcomingAssignments(
  tasks: AssignmentTask[],
  limit = 3,
  now: Date = new Date()
): AssignmentTask[] {
  return tasks
    .filter((t) => t.status !== 'Done')
    .filter((t) => {
      const due = new Date(t.dueDate);
      return !Number.isNaN(due.getTime()) && due.getTime() > now.getTime();
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, limit);
}

export function buildDynamicSchoolGreeting(
  tasks: AssignmentTask[],
  seed = 0,
  now: Date = new Date()
): string {
  const openTasks = tasks
    .filter((t) => t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (openTasks.length === 0) {
    const allClearMessages = [
      'Hi Ghirmay, all Canvas assignments are cleared — perfect time to review flashcards!',
      'Hey Ghirmay, zero overdue tasks right now. Run a quick Pomodoro focus sprint to stay ahead.',
    ];
    return allClearMessages[Math.abs(seed) % allClearMessages.length];
  }

  const overdue = openTasks.filter((t) => getTaskUrgency(t.dueDate, t.status, now) === 'overdue');
  const dueToday = openTasks.filter((t) => getTaskUrgency(t.dueDate, t.status, now) === 'due-today');
  const upcoming = openTasks.filter((t) => getTaskUrgency(t.dueDate, t.status, now) === 'upcoming');

  const candidates: string[] = [];

  for (const task of overdue.slice(0, 2)) {
    candidates.push(
      `Hi Ghirmay, don't forget your ${task.className} "${task.title}" is overdue — knock it out first!`
    );
  }
  for (const task of dueToday.slice(0, 2)) {
    candidates.push(
      `Hi Ghirmay, don't forget your ${task.title} (${task.className}) today — ${formatCountdownLabel(task.dueDate, now)}!`
    );
  }
  for (const task of upcoming.slice(0, 3)) {
    candidates.push(
      `Hey Ghirmay, ${task.className} "${task.title}" is coming up (${formatCountdownLabel(task.dueDate, now)}) — prep in AI Study Hub.`
    );
  }

  if (candidates.length === 0) {
    const first = openTasks[0];
    return `Hi Ghirmay, you have ${openTasks.length} open tasks starting with ${first.title} (${first.className}).`;
  }

  return candidates[Math.abs(seed) % candidates.length];
}

export function compileMegaUpgradePrompt(ideas: UpgradeIdeaItem[]): string {
  if (!ideas || ideas.length === 0) {
    return 'No quick upgrade ideas submitted yet. Click the top-right "!" button anywhere in Study Sole to queue upgrade ideas into this Mega Upgrade Prompt.';
  }

  const grouped = ideas
    .map((idea, idx) => {
      const stamp = new Date(idea.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      return `${idx + 1}. [${idea.target} · ${stamp}] ${idea.text}`;
    })
    .join('\n');

  return [
    '=== STUDY SOLE MEGA UPGRADE PROMPT (FOR GHIRMAY) ===',
    `Total Queued Upgrades: ${ideas.length}`,
    '',
    'Implement all of the following requested upgrades cleanly while preserving Canvas .ics sync, Gizmo/Thea study tools, Sneaker Vault profit/loss & return tracking, and localStorage data:',
    '',
    grouped,
  ].join('\n');
}

export function calculateNeededFinalScore(
  currentPercent: number,
  targetPercent: number,
  finalWeightPercent: number
): number {
  if (finalWeightPercent <= 0) return targetPercent;
  const w = Math.min(100, Math.max(1, finalWeightPercent)) / 100;
  const needed = (targetPercent - currentPercent * (1 - w)) / w;
  return Math.round(needed * 10) / 10;
}

export function calculateWeightedGpaAverage(grades: CourseGrade[]): number {
  if (grades.length === 0) return 0;
  let totalCredits = 0;
  let weightedSum = 0;
  for (const g of grades) {
    const credits = Math.max(0.5, g.credits || 1);
    totalCredits += credits;
    weightedSum += g.currentPercent * credits;
  }
  return totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 10) / 10 : 0;
}

export function getBackupAgeDays(lastBackupAt: string | null, now: Date = new Date()): number | null {
  if (!lastBackupAt) return null;
  const dt = new Date(lastBackupAt);
  if (Number.isNaN(dt.getTime())) return null;
  const diffMs = now.getTime() - dt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function verifyVaultPin(inputPin: string, storedPin: string): boolean {
  const expected = isValidPinFormat(storedPin) ? storedPin : '1234';
  return inputPin.trim() === expected;
}

export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const ACTIVITY_XP_REWARDS: Record<'pomodoro' | 'flashcard' | 'quiz', number> = {
  pomodoro: 50,
  quiz: 40,
  flashcard: 15,
};

export function recordStudyActivity(
  stats: StudyProgressStats,
  activityType: 'pomodoro' | 'flashcard' | 'quiz',
  now: Date = new Date()
): StudyProgressStats {
  const todayKey = toLocalDateKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterdayDate);

  let nextStreak = stats.streakDays || 0;
  if (stats.lastActivityDate === todayKey) {
    nextStreak = Math.max(1, nextStreak);
  } else if (stats.lastActivityDate === yesterdayKey) {
    nextStreak = Math.max(1, nextStreak + 1);
  } else {
    nextStreak = 1;
  }

  const gainedXp = ACTIVITY_XP_REWARDS[activityType];

  return {
    streakDays: nextStreak,
    xp: (stats.xp || 0) + gainedXp,
    lastActivityDate: todayKey,
    completedPomodoros:
      (stats.completedPomodoros || 0) + (activityType === 'pomodoro' ? 1 : 0),
    completedQuizzes:
      (stats.completedQuizzes || 0) + (activityType === 'quiz' ? 1 : 0),
  };
}

const VALID_SOLE_THEMES: SoleThemeColor[] = [
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
];

export function validateAndParseBackup(rawJson: string): PersistedAppState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON file. Please choose a valid Study Sole backup (.json).');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Backup file is malformed.');
  }

  const obj = parsed as Partial<PersistedAppState>;
  if (!Array.isArray(obj.tasks) || !Array.isArray(obj.sneakers)) {
    throw new Error('Backup file is missing required tasks or sneakers arrays.');
  }

  const rawPin = obj.settings?.vaultPin ?? '1234';
  const rawGoal = obj.settings?.monthlyProfitGoal;
  const monthlyProfitGoal =
    typeof rawGoal === 'number' && Number.isFinite(rawGoal) && rawGoal > 0
      ? rawGoal
      : 500;

  const rawSoleTheme = obj.settings?.soleThemeColor;
  const soleThemeColor: SoleThemeColor =
    rawSoleTheme && VALID_SOLE_THEMES.includes(rawSoleTheme)
      ? rawSoleTheme
      : 'black';

  const normalizedStats: StudyProgressStats = {
    streakDays:
      typeof obj.studyStats?.streakDays === 'number'
        ? Math.max(0, obj.studyStats.streakDays)
        : 0,
    xp:
      typeof obj.studyStats?.xp === 'number'
        ? Math.max(0, obj.studyStats.xp)
        : 0,
    lastActivityDate:
      typeof obj.studyStats?.lastActivityDate === 'string'
        ? obj.studyStats.lastActivityDate
        : null,
    completedPomodoros:
      typeof obj.studyStats?.completedPomodoros === 'number'
        ? Math.max(0, obj.studyStats.completedPomodoros)
        : 0,
    completedQuizzes:
      typeof obj.studyStats?.completedQuizzes === 'number'
        ? Math.max(0, obj.studyStats.completedQuizzes)
        : 0,
  };

  const rawCity = obj.studyCity;
  const fallbackCity = createInitialStudyCity(
    normalizedStats.xp,
    normalizedStats.completedPomodoros
  );
  const parsedBlueprints =
    typeof rawCity?.blueprints === 'number'
      ? Math.max(0, rawCity.blueprints)
      : fallbackCity.blueprints;
  const parsedTrophy = Boolean(rawCity?.championshipTrophyUnlocked);
  const computedLevel = computeCityLevelFromBlueprints(parsedBlueprints);
  const parsedLandmarks: CityLandmarkId[] = Array.isArray(rawCity?.unlockedLandmarks)
    ? (Array.from(
        new Set([
          ...rawCity.unlockedLandmarks,
          ...getUnlockedLandmarksForState(computedLevel, parsedTrophy),
        ])
      ) as CityLandmarkId[])
    : getUnlockedLandmarksForState(computedLevel, parsedTrophy);

  return {
    version: typeof obj.version === 'number' ? obj.version : 2,
    tasks: obj.tasks,
    calendarEvents: Array.isArray(obj.calendarEvents) ? obj.calendarEvents : [],
    studyNotes: typeof obj.studyNotes === 'string' ? obj.studyNotes : '',
    studyTitle: typeof obj.studyTitle === 'string' ? obj.studyTitle : 'Study Notes',
    studySet: obj.studySet ?? null,
    grades: Array.isArray(obj.grades) ? obj.grades : [],
    classLinks: Array.isArray(obj.classLinks) ? obj.classLinks : [],
    sneakers: obj.sneakers,
    studyStats: normalizedStats,
    studyCity: {
      bricks:
        typeof rawCity?.bricks === 'number'
          ? Math.max(0, rawCity.bricks)
          : fallbackCity.bricks,
      blueprints: parsedBlueprints,
      level: computedLevel,
      totalStudyMinutes:
        typeof rawCity?.totalStudyMinutes === 'number'
          ? Math.max(0, rawCity.totalStudyMinutes)
          : fallbackCity.totalStudyMinutes,
      unlockedLandmarks: parsedLandmarks,
      championshipTrophyUnlocked: parsedTrophy,
      bossBattlesWon:
        typeof rawCity?.bossBattlesWon === 'number'
          ? Math.max(0, rawCity.bossBattlesWon)
          : 0,
      completedFocusToday:
        typeof rawCity?.completedFocusToday === 'number'
          ? Math.max(0, rawCity.completedFocusToday)
          : 0,
      completedUrgentTasks:
        typeof rawCity?.completedUrgentTasks === 'number'
          ? Math.max(0, rawCity.completedUrgentTasks)
          : 0,
      highScoreQuizzes:
        typeof rawCity?.highScoreQuizzes === 'number'
          ? Math.max(0, rawCity.highScoreQuizzes)
          : 0,
      lastQuestDate:
        typeof rawCity?.lastQuestDate === 'string'
          ? rawCity.lastQuestDate
          : toLocalDateKey(),
      lastQuestWeek:
        typeof rawCity?.lastQuestWeek === 'string'
          ? rawCity.lastQuestWeek
          : getIsoWeekKey(),
      claimedQuests:
        rawCity?.claimedQuests && typeof rawCity.claimedQuests === 'object'
          ? rawCity.claimedQuests
          : {},
    },
    upgradeIdeas: Array.isArray(obj.upgradeIdeas) ? obj.upgradeIdeas : [],
    appliedDevPatches: Array.isArray(obj.appliedDevPatches) ? obj.appliedDevPatches : [],
    settings: {
      canvasIcsUrl: obj.settings?.canvasIcsUrl ?? '',
      googleCalendarUrl: obj.settings?.googleCalendarUrl ?? '',
      motionPaused: Boolean(obj.settings?.motionPaused),
      lastBackupAt: obj.settings?.lastBackupAt ?? null,
      vaultPin: isValidPinFormat(rawPin) ? rawPin : '1234',
      monthlyProfitGoal,
      startingBankroll: typeof obj.settings?.startingBankroll === 'number' && obj.settings.startingBankroll >= 0 ? obj.settings.startingBankroll : 2500,
      studyThemeColor: normalizeHexColor(obj.settings?.studyThemeColor ?? '#04070f'),
      soleThemeColor,
      studioAnnouncement:
        typeof obj.settings?.studioAnnouncement === 'string'
          ? obj.settings.studioAnnouncement
          : '',
    },
  };
}
