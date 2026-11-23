import ICAL from 'ical.js';
import { AssignmentTask, CalendarEventItem } from '../types/app';

export interface ParsedIcsResult {
  events: CalendarEventItem[];
  assignments: AssignmentTask[];
}

function extractClassName(summary: string, categories?: string, location?: string): string {
  const bracketMatch = summary.match(/\[([^\]]+)\]/);
  if (bracketMatch?.[1]) {
    return bracketMatch[1].trim();
  }
  const parenMatch = summary.match(/\(([^)]+)\)\s*$/);
  if (parenMatch?.[1] && parenMatch[1].length <= 32) {
    return parenMatch[1].trim();
  }
  if (categories && categories.trim().length > 0) {
    return categories.trim();
  }
  if (location && location.trim().length > 0) {
    return location.trim();
  }
  return 'Canvas Course';
}

function cleanAssignmentTitle(summary: string): string {
  return summary
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\([^)]+\)\s*$/, '')
    .trim() || summary.trim();
}

export function parseCanvasIcs(icsText: string): ParsedIcsResult {
  if (!icsText || !icsText.trim()) {
    throw new Error('The .ics feed is empty.');
  }

  let jcalData: unknown;
  try {
    jcalData = ICAL.parse(icsText);
  } catch {
    throw new Error('Invalid .ics calendar format. Check the Canvas feed content.');
  }

  const comp = new ICAL.Component(jcalData as unknown[]);
  const vevents = comp.getAllSubcomponents('vevent');

  const events: CalendarEventItem[] = [];
  const assignments: AssignmentTask[] = [];

  for (let i = 0; i < vevents.length; i += 1) {
    const vevent = vevents[i];
    const event = new ICAL.Event(vevent);
    const uid = event.uid || `ics-${i}-${event.summary || 'item'}`;
    const rawSummary = (event.summary || 'Untitled Canvas Event').trim();
    const startDate = event.startDate ? event.startDate.toJSDate() : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
      continue;
    }
    const endDate = event.endDate ? event.endDate.toJSDate() : undefined;
    const catProp = vevent.getFirstPropertyValue('categories');
    const categories = typeof catProp === 'string' ? catProp : undefined;
    const className = extractClassName(rawSummary, categories, event.location || undefined);
    const title = cleanAssignmentTitle(rawSummary);

    events.push({
      id: `cal-${uid}`,
      uid,
      title,
      className,
      startDate: startDate.toISOString(),
      endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : undefined,
      description: event.description || undefined,
      location: event.location || undefined,
      source: 'canvas-ics',
    });

    const isUrgentKeyword = /exam|quiz|test|midterm|final|project|due/i.test(rawSummary);
    assignments.push({
      id: `ics-task-${uid}`,
      icsUid: uid,
      className,
      title,
      dueDate: startDate.toISOString(),
      priority: isUrgentKeyword ? 'High' : 'Medium',
      status: 'To Do',
      source: 'canvas-ics',
      notes: event.description || undefined,
    });
  }

  return { events, assignments };
}

export function mergeSyncedAssignments(
  existing: AssignmentTask[],
  incoming: AssignmentTask[]
): AssignmentTask[] {
  const byIcsUid = new Map<string, AssignmentTask>();
  const manualTasks: AssignmentTask[] = [];

  for (const task of existing) {
    if (task.source === 'canvas-ics' && task.icsUid) {
      byIcsUid.set(task.icsUid, task);
    } else {
      manualTasks.push(task);
    }
  }

  const mergedIcs: AssignmentTask[] = incoming.map((inc) => {
    const prev = inc.icsUid ? byIcsUid.get(inc.icsUid) : undefined;
    if (prev) {
      return {
        ...inc,
        id: prev.id,
        status: prev.status,
        priority: prev.priority,
      };
    }
    return inc;
  });

  // Preserve older synced tasks not in incoming if needed, or replace feed items cleanly
  const incomingUids = new Set(incoming.map((t) => t.icsUid).filter(Boolean));
  const retainedOld = existing.filter(
    (t) => t.source === 'canvas-ics' && t.icsUid && !incomingUids.has(t.icsUid)
  );

  return [...manualTasks, ...mergedIcs, ...retainedOld].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}
