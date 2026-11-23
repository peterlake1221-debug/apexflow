import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNeededFinalScore,
  getTaskUrgency,
  formatCountdownLabel,
  getBackupAgeDays,
  validateAndParseBackup,
  verifyVaultPin,
  isValidPinFormat,
  recordStudyActivity,
  buildDynamicSchoolGreeting,
  compileMegaUpgradePrompt,
  DEV_STUDIO_PIN,
} from './studyAndGrades';
import { isLightHexColor, resolveWorkspaceTheme } from './themeUtils';
import { AssignmentTask } from '../types/app';

test('calculateNeededFinalScore computes required final exam percentage', () => {
  assert.equal(calculateNeededFinalScore(88, 90, 20), 98);
});

test('getTaskUrgency distinguishes overdue, due-today, upcoming, and done', () => {
  const now = new Date('2026-11-22T14:00:00Z');
  assert.equal(getTaskUrgency('2026-11-21T12:00:00Z', 'To Do', now), 'overdue');
  assert.equal(getTaskUrgency('2026-11-22T20:00:00Z', 'To Do', now), 'due-today');
  assert.equal(getTaskUrgency('2026-11-25T20:00:00Z', 'To Do', now), 'upcoming');
  assert.equal(getTaskUrgency('2026-11-20T12:00:00Z', 'Done', now), 'done');
});

test('formatCountdownLabel formats hours and days cleanly', () => {
  const now = new Date('2026-11-22T10:00:00Z');
  assert.equal(formatCountdownLabel('2026-11-22T14:00:00Z', now), 'Due in 4 hours');
  assert.equal(formatCountdownLabel('2026-11-24T10:00:00Z', now), 'Due in 2 days');
});

test('backup age and validation handle valid payloads including themes and upgradeIdeas', () => {
  const now = new Date('2026-11-22T10:00:00Z');
  assert.equal(getBackupAgeDays(null, now), null);
  assert.equal(getBackupAgeDays('2026-11-19T10:00:00Z', now), 3);

  const validJson = JSON.stringify({
    version: 2,
    tasks: [],
    sneakers: [],
    upgradeIdeas: [
      { id: '1', text: 'Add dark blue mode', target: 'Study', createdAt: '2026-11-22T10:00:00Z' },
    ],
    settings: {
      vaultPin: '5678',
      studyThemeColor: '#f8fafc',
      soleThemeColor: 'yellow',
    },
  });
  const parsed = validateAndParseBackup(validJson);
  assert.equal(parsed.settings.vaultPin, '5678');
  assert.equal(parsed.settings.studyThemeColor, '#f8fafc');
  assert.equal(parsed.settings.soleThemeColor, 'yellow');
  assert.equal(parsed.upgradeIdeas.length, 1);
  assert.throws(() => validateAndParseBackup('not-json'));
});

test('buildDynamicSchoolGreeting connects to upcoming Canvas deadlines and rotates by seed', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const tasks: AssignmentTask[] = [
    {
      id: 't1',
      className: 'AP Calculus AB',
      title: 'Unit Test',
      dueDate: '2026-11-22T18:00:00Z',
      priority: 'High',
      status: 'To Do',
    },
    {
      id: 't2',
      className: 'AP Biology',
      title: 'Lab Report',
      dueDate: '2026-11-24T18:00:00Z',
      priority: 'Medium',
      status: 'To Do',
    },
  ];
  const g0 = buildDynamicSchoolGreeting(tasks, 0, now);
  const g1 = buildDynamicSchoolGreeting(tasks, 1, now);
  assert.ok(g0.includes('Ghirmay'));
  assert.ok(g0.includes('Unit Test'));
  assert.notEqual(g0, g1);
});

test('compileMegaUpgradePrompt merges submitted upgrade ideas cleanly', () => {
  const prompt = compileMegaUpgradePrompt([
    { id: 'a', text: 'Add voice shortcut', target: 'Study', createdAt: '2026-11-22T10:00:00Z' },
    { id: 'b', text: 'Highlight StockX spread', target: 'Sole', createdAt: '2026-11-22T10:05:00Z' },
  ]);
  assert.ok(prompt.includes('Total Queued Upgrades: 2'));
  assert.ok(prompt.includes('Add voice shortcut'));
  assert.ok(prompt.includes('Highlight StockX spread'));
  assert.equal(DEV_STUDIO_PIN, '1248');
});

test('theme luminance and Study/Sole color resolution switch contrast properly', () => {
  assert.equal(isLightHexColor('#f8fafc'), true);
  assert.equal(isLightHexColor('#04070f'), false);
  assert.equal(resolveWorkspaceTheme('school', '#f8fafc', 'black').isLight, true);
  assert.equal(resolveWorkspaceTheme('inventory', '#04070f', 'yellow').isLight, true);
  assert.equal(resolveWorkspaceTheme('inventory', '#04070f', 'red').isLight, false);
});

test('vault PIN validation checks 4-digit format and matches stored PIN', () => {
  assert.equal(isValidPinFormat('1234'), true);
  assert.equal(isValidPinFormat('12a4'), false);
  assert.equal(verifyVaultPin('1234', '1234'), true);
  assert.equal(verifyVaultPin('9999', '1234'), false);
});

test('recordStudyActivity increments streak on consecutive day, preserves on same day, resets after gap, and adds XP', () => {
  const day1 = new Date(2026, 10, 20, 14, 0, 0);
  const s1 = recordStudyActivity(
    {
      streakDays: 0,
      xp: 0,
      lastActivityDate: null,
      completedPomodoros: 0,
      completedQuizzes: 0,
    },
    'pomodoro',
    day1
  );
  assert.equal(s1.streakDays, 1);
  assert.equal(s1.xp, 50);
  assert.equal(s1.completedPomodoros, 1);

  const sSameDay = recordStudyActivity(s1, 'quiz', day1);
  assert.equal(sSameDay.streakDays, 1);
  assert.equal(sSameDay.xp, 90);
  assert.equal(sSameDay.completedQuizzes, 1);

  const day2 = new Date(2026, 10, 21, 9, 0, 0);
  const sDay2 = recordStudyActivity(sSameDay, 'flashcard', day2);
  assert.equal(sDay2.streakDays, 2);
  assert.equal(sDay2.xp, 105);

  const day4 = new Date(2026, 10, 23, 9, 0, 0);
  const sDay4 = recordStudyActivity(sDay2, 'pomodoro', day4);
  assert.equal(sDay4.streakDays, 1);
  assert.equal(sDay4.xp, 155);
});
