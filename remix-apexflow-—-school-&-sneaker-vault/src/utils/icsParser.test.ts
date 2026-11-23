import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCanvasIcs, mergeSyncedAssignments } from './icsParser';
import { AssignmentTask } from '../types/app';

test('parseCanvasIcs extracts events and synced assignments using ical.js', () => {
  const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Canvas LMS//EN
BEGIN:VEVENT
UID:evt-101
DTSTART:20261124T170000Z
SUMMARY:Midterm Review Quiz [AP Calculus AB]
DESCRIPTION:Chapters 1 to 4
END:VEVENT
BEGIN:VEVENT
UID:evt-102
DTSTART:20261125T235900Z
SUMMARY:Lab Report Draft (AP Biology)
END:VEVENT
END:VCALENDAR`;

  const parsed = parseCanvasIcs(sampleIcs);
  assert.equal(parsed.events.length, 2);
  assert.equal(parsed.assignments.length, 2);
  assert.equal(parsed.assignments[0].className, 'AP Calculus AB');
  assert.equal(parsed.assignments[0].title, 'Midterm Review Quiz');
  assert.equal(parsed.assignments[0].priority, 'High');
  assert.equal(parsed.assignments[1].className, 'AP Biology');
  assert.equal(parsed.assignments[1].title, 'Lab Report Draft');
});

test('mergeSyncedAssignments updates existing Canvas items while preserving manual tasks and status', () => {
  const existing: AssignmentTask[] = [
    {
      id: 'manual-1',
      className: 'English',
      title: 'Read Chapter 5',
      dueDate: '2026-11-23T12:00:00Z',
      priority: 'Low',
      status: 'In Progress',
      source: 'manual',
    },
    {
      id: 'ics-task-evt-101',
      icsUid: 'evt-101',
      className: 'AP Calculus AB',
      title: 'Old Title',
      dueDate: '2026-11-24T17:00:00Z',
      priority: 'High',
      status: 'Done',
      source: 'canvas-ics',
    },
  ];

  const incoming: AssignmentTask[] = [
    {
      id: 'ics-task-evt-101',
      icsUid: 'evt-101',
      className: 'AP Calculus AB',
      title: 'Updated Quiz Title',
      dueDate: '2026-11-24T18:00:00Z',
      priority: 'Medium',
      status: 'To Do',
      source: 'canvas-ics',
    },
  ];

  const merged = mergeSyncedAssignments(existing, incoming);
  assert.equal(merged.length, 2);
  const synced = merged.find((t) => t.icsUid === 'evt-101');
  assert.equal(synced?.title, 'Updated Quiz Title');
  assert.equal(synced?.status, 'Done'); // Preserved Done status
});
