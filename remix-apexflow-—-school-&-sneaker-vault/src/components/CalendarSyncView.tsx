import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AssignmentTask, CalendarEventItem } from '../types/app';
import { parseCanvasIcs } from '../utils/icsParser';
import { SAMPLE_CANVAS_ICS } from '../data/seedData';

interface CalendarSyncViewProps {
  events: CalendarEventItem[];
  tasks: AssignmentTask[];
  canvasIcsUrl: string;
  googleCalendarUrl: string;
  onUpdateCanvasIcsUrl: (url: string) => void;
  onUpdateGoogleCalendarUrl: (url: string) => void;
  onSyncParsedIcs: (events: CalendarEventItem[], assignments: AssignmentTask[]) => void;
}

export const CalendarSyncView: React.FC<CalendarSyncViewProps> = ({
  events,
  tasks,
  canvasIcsUrl,
  googleCalendarUrl,
  onUpdateCanvasIcsUrl,
  onUpdateGoogleCalendarUrl,
  onSyncParsedIcs,
}) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [pastedIcs, setPastedIcs] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showGoogleEmbed, setShowGoogleEmbed] = useState(false);

  const combinedItems = useMemo(() => {
    const taskItems = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      className: t.className,
      dateIso: t.dueDate,
      status: t.status,
    }));
    const eventOnly = events
      .filter((e) => !tasks.some((t) => t.icsUid && t.icsUid === e.uid))
      .map((e) => ({
        id: e.id,
        title: e.title,
        className: e.className,
        dateIso: e.startDate,
        status: 'Event' as const,
      }));
    return [...taskItems, ...eventOnly];
  }, [events, tasks]);

  const applyIcsString = (icsText: string, label: string) => {
    try {
      const parsed = parseCanvasIcs(icsText);
      onSyncParsedIcs(parsed.events, parsed.assignments);
      setSyncError(null);
      setSyncMessage(
        `Synced ${parsed.assignments.length} Canvas events & assignments from ${label}.`
      );
    } catch (err) {
      setSyncMessage(null);
      setSyncError(err instanceof Error ? err.message : 'Failed to parse .ics calendar.');
    }
  };

  const handleFetchIcsUrl = async () => {
    if (!canvasIcsUrl.trim()) {
      setSyncError('Paste a Canvas .ics feed URL first.');
      return;
    }
    setSyncLoading(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/calendar/fetch-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canvasIcsUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not fetch Canvas .ics feed.');
      }
      applyIcsString(data.icsText, 'Canvas feed URL');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to fetch .ics feed.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleUploadIcsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    applyIcsString(text, file.name);
    e.target.value = '';
  };

  // Build Monthly / Weekly grid days
  const calendarDays = useMemo(() => {
    if (viewMode === 'weekly') {
      const start = new Date(cursorDate);
      start.setDate(cursorDate.getDate() - cursorDate.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return { date: d, inMonth: true };
      });
    }

    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const startGrid = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(startGrid);
      d.setDate(startGrid.getDate() + i);
      return { date: d, inMonth: d.getMonth() === month };
    });
  }, [cursorDate, viewMode]);

  const shiftCursor = (dir: -1 | 1) => {
    const next = new Date(cursorDate);
    if (viewMode === 'weekly') {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setCursorDate(next);
  };

  const today = new Date();
  const safeGoogleUrl =
    googleCalendarUrl.startsWith('https://') || googleCalendarUrl.startsWith('http://')
      ? googleCalendarUrl
      : 'https://calendar.google.com';

  return (
    <div className="space-y-6">
      {/* Connect Canvas Calendar & Google Calendar Panel */}
      <section className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(37,99,235,0.1)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono-nums font-semibold uppercase tracking-wider text-blue-300 mb-1">
              <span
                className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.9)]"
                aria-hidden="true"
              />
              <span>Canvas Sync · {events.length} Events Active</span>
            </div>
            <h1 className="font-display font-bold text-xl text-white">
              Connect Canvas Calendar (.ics) &amp; Google Calendar
            </h1>
            <p className="text-sm text-slate-400">
              Automatically parses .ics feeds with ical.js into your calendar grid and Homework Board.
            </p>
          </div>

          <button
            type="button"
            onClick={() => applyIcsString(SAMPLE_CANVAS_ICS, 'Sample Canvas Feed')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/35 transition-colors whitespace-nowrap"
          >
            Load Sample Canvas .ics
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg bg-[#0b1120] border border-slate-800 p-4 space-y-3">
            <label htmlFor="canvas-ics-url" className="block text-xs font-semibold text-blue-300">
              Canvas .ics Feed URL
            </label>
            <div className="flex gap-2">
              <input
                id="canvas-ics-url"
                type="url"
                value={canvasIcsUrl}
                onChange={(e) => onUpdateCanvasIcsUrl(e.target.value)}
                placeholder="https://school.instructure.com/feeds/calendars/user_xxx.ics"
                className="flex-1 min-w-0 rounded-lg bg-[#0f1624] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleFetchIcsUrl}
                disabled={syncLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Sync URL</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                <span>Upload .ics File</span>
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  onChange={handleUploadIcsFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (pastedIcs.trim()) {
                    applyIcsString(pastedIcs, 'Pasted .ics Text');
                  }
                }}
                disabled={!pastedIcs.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700"
              >
                Parse Pasted .ics
              </button>
            </div>

            <textarea
              rows={2}
              value={pastedIcs}
              onChange={(e) => setPastedIcs(e.target.value)}
              placeholder="Or paste raw BEGIN:VCALENDAR ... END:VCALENDAR content here"
              className="w-full rounded-lg bg-[#0f1624] border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Google Calendar Field */}
          <div className="rounded-lg bg-[#0b1120] border border-slate-800 p-4 space-y-3">
            <label htmlFor="gcal-url" className="block text-xs font-semibold text-indigo-300">
              Google Calendar Link or Embed URL
            </label>
            <div className="flex gap-2">
              <input
                id="gcal-url"
                type="url"
                value={googleCalendarUrl}
                onChange={(e) => onUpdateGoogleCalendarUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/embed?src=..."
                className="flex-1 min-w-0 rounded-lg bg-[#0f1624] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <a
                href={safeGoogleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400">
                Paste a public Google Calendar embed URL to preview inline.
              </p>
              <button
                type="button"
                onClick={() => setShowGoogleEmbed((s) => !s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/35 whitespace-nowrap"
              >
                {showGoogleEmbed ? 'Hide Embed' : 'Preview Embed'}
              </button>
            </div>

            {showGoogleEmbed && googleCalendarUrl.includes('calendar.google.com/calendar/embed') && (
              <iframe
                title="Google Calendar Embed"
                src={safeGoogleUrl}
                className="w-full h-56 rounded-lg border border-slate-800 bg-white"
              />
            )}
            {showGoogleEmbed && !googleCalendarUrl.includes('calendar.google.com/calendar/embed') && (
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300">
                Google Calendar only permits iframe embedding with a `/calendar/embed?src=...` URL. Use the &ldquo;Open&rdquo; button above to launch your personal calendar directly.
              </div>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{syncMessage}</span>
          </div>
        )}
        {syncError && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{syncError}</span>
          </div>
        )}
      </section>

      {/* Interactive Monthly / Weekly Calendar */}
      <section className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.45)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <h2 className="font-display font-bold text-lg text-white">
              {cursorDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftCursor(-1)}
                aria-label="Previous period"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCursorDate(new Date())}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftCursor(1)}
                aria-label="Next period"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#090d16] border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map(({ date, inMonth }, idx) => {
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();

            const dayEvents = combinedItems.filter((item) => {
              const d = new Date(item.dateIso);
              return (
                d.getFullYear() === date.getFullYear() &&
                d.getMonth() === date.getMonth() &&
                d.getDate() === date.getDate()
              );
            });

            return (
              <div
                key={idx}
                className={`rounded-lg border p-2 flex flex-col gap-1 ${
                  viewMode === 'weekly' ? 'min-h-36' : 'min-h-24'
                } ${
                  isToday
                    ? 'bg-blue-950/35 border-blue-500/60'
                    : inMonth
                      ? 'bg-[#0b1120] border-slate-800/90'
                      : 'bg-[#090d16]/60 border-slate-800/40 opacity-55'
                }`}
              >
                <div
                  className={`font-mono-nums text-xs font-semibold ${
                    isToday ? 'text-blue-300' : 'text-slate-400'
                  }`}
                >
                  {date.getDate()}
                </div>

                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, viewMode === 'weekly' ? 6 : 3).map((ev) => (
                    <div
                      key={ev.id}
                      title={`${ev.className}: ${ev.title}`}
                      className={`rounded px-1.5 py-0.5 text-[11px] truncate ${
                        ev.status === 'Done'
                          ? 'bg-slate-800 text-slate-400 line-through'
                          : 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > (viewMode === 'weekly' ? 6 : 3) && (
                    <div className="text-[10px] text-slate-400 font-mono-nums">
                      +{dayEvents.length - (viewMode === 'weekly' ? 6 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
