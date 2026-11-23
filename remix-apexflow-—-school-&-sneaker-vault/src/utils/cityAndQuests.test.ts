import test from 'node:test';
import assert from 'node:assert/strict';
import {
  awardBossBattleVictory,
  awardCityFocusCompletion,
  claimCityQuestReward,
  computeCityLevelFromBlueprints,
  computeStudyQuests,
  createInitialStudyCity,
  getCityEnvironment,
  recordHighScoreQuizForCity,
  recordUrgentTaskCompletionForCity,
} from './cityAndQuests';
import { validateAndParseBackup } from './studyAndGrades';
import { AssignmentTask } from '../types/app';

test('city evolves cleanly across all 5 blueprint tiers and unlocks landmarks', () => {
  assert.equal(computeCityLevelFromBlueprints(0), 1);
  assert.equal(computeCityLevelFromBlueprints(199), 1);
  assert.equal(computeCityLevelFromBlueprints(200), 2);
  assert.equal(computeCityLevelFromBlueprints(500), 3);
  assert.equal(computeCityLevelFromBlueprints(900), 4);
  assert.equal(computeCityLevelFromBlueprints(1400), 5);

  let city = createInitialStudyCity(150, 2, new Date('2026-11-22T12:00:00Z'));
  assert.equal(city.level, 1);

  // Sunny bonus multiplier (1.1x -> +83 Bricks, +55 BP -> 205 BP -> Lv. 2)
  city = awardCityFocusCompletion(city, 25, 1.1, new Date('2026-11-22T12:00:00Z'));
  assert.equal(city.blueprints, 205);
  assert.equal(city.level, 2);
  assert.ok(city.unlockedLandmarks.includes('cafe'));
  assert.equal(city.totalStudyMinutes, 75);
});

test('city environment detects sunny +10% bonus XP vs overdue rain clouds and day/night lighting', () => {
  const cleanTasks: AssignmentTask[] = [
    {
      id: 't1',
      className: 'AP Calc',
      title: 'Quiz Prep',
      dueDate: '2026-11-25T15:00:00Z',
      priority: 'High',
      status: 'To Do',
      source: 'manual',
    },
  ];
  const dayNoOverdue = getCityEnvironment(cleanTasks, new Date(2026, 10, 22, 14, 0, 0));
  assert.equal(dayNoOverdue.weather, 'sunny');
  assert.equal(dayNoOverdue.bonusXpMultiplier, 1.1);
  assert.equal(dayNoOverdue.windowsLit, false);

  const overdueTasks: AssignmentTask[] = [
    ...cleanTasks,
    {
      id: 't2',
      className: 'English',
      title: 'Overdue Essay',
      dueDate: '2026-11-20T15:00:00Z',
      priority: 'High',
      status: 'To Do',
      source: 'manual',
    },
  ];
  const nightWithOverdue = getCityEnvironment(overdueTasks, new Date(2026, 10, 22, 21, 30, 0));
  assert.equal(nightWithOverdue.weather, 'rain');
  assert.equal(nightWithOverdue.bonusXpMultiplier, 1);
  assert.equal(nightWithOverdue.windowsLit, true);
  assert.equal(nightWithOverdue.overdueCount, 1);
});

test('daily and weekly study quests track progress and award bricks/blueprints once per period', () => {
  const now = new Date(2026, 10, 22, 13, 0, 0);
  let city = createInitialStudyCity(100, 1, now);

  // Complete 2 focus blocks + 1 urgent task + 85% quiz
  city = awardCityFocusCompletion(city, 25, 1, now);
  city = awardCityFocusCompletion(city, 25, 1, now);
  city = recordUrgentTaskCompletionForCity(city, now);
  city = recordHighScoreQuizForCity(city, 85, now);

  const quests = computeStudyQuests(city, now);
  assert.equal(quests[0].canClaim, true); // daily-focus-2
  assert.equal(quests[1].canClaim, true); // daily-urgent-task
  assert.equal(quests[2].canClaim, true); // weekly-quiz-80

  const bricksBefore = city.bricks;
  const claim1 = claimCityQuestReward(city, 'daily-focus-2', now);
  assert.equal(claim1.awarded, true);
  assert.equal(claim1.bricksAdded, 150);
  assert.equal(claim1.nextCity.bricks, bricksBefore + 150);

  // Double-claim prevented
  const doubleClaim = claimCityQuestReward(claim1.nextCity, 'daily-focus-2', now);
  assert.equal(doubleClaim.awarded, false);

  // Claim blueprints quest
  const claim2 = claimCityQuestReward(claim1.nextCity, 'daily-urgent-task', now);
  assert.equal(claim2.awarded, true);
  assert.equal(claim2.blueprintsAdded, 200);
});

test('boss battle victory permanently unlocks Championship Trophy Monument and awards XP', () => {
  const now = new Date(2026, 10, 22, 16, 0, 0);
  const city = createInitialStudyCity(200, 2, now);
  const won = awardBossBattleVictory(city, 1.1, 45, now);
  assert.equal(won.championshipTrophyUnlocked, true);
  assert.equal(won.bossBattlesWon, 1);
  assert.ok(won.unlockedLandmarks.includes('trophy-monument'));
  assert.ok(won.blueprints >= 475);
});

test('validateAndParseBackup migrates legacy backups without studyCity and preserves studyCity fields', () => {
  const legacyJson = JSON.stringify({
    version: 2,
    tasks: [],
    sneakers: [],
    studyStats: {
      streakDays: 3,
      xp: 550,
      lastActivityDate: '2026-11-22',
      completedPomodoros: 4,
      completedQuizzes: 1,
    },
  });
  const migrated = validateAndParseBackup(legacyJson);
  assert.equal(migrated.studyCity.blueprints, 550);
  assert.equal(migrated.studyCity.level, 3);
  assert.ok(migrated.studyCity.unlockedLandmarks.includes('library'));

  const withTrophy = JSON.stringify({
    ...migrated,
    studyCity: {
      ...migrated.studyCity,
      blueprints: 1450,
      championshipTrophyUnlocked: true,
      bossBattlesWon: 2,
    },
  });
  const parsed = validateAndParseBackup(withTrophy);
  assert.equal(parsed.studyCity.level, 5);
  assert.equal(parsed.studyCity.championshipTrophyUnlocked, true);
  assert.equal(parsed.studyCity.bossBattlesWon, 2);
});
