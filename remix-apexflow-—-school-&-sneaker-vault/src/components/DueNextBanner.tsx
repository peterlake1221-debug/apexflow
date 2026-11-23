import React, { useEffect, useState } from 'react';
import { Clock, Sparkles, Swords } from 'lucide-react';
import { AssignmentTask } from '../types/app';
import { formatCountdownLabel, getNextUpcomingAssignments } from '../utils/studyAndGrades';

interface DueNextBannerProps {
  tasks: AssignmentTask[];
  onStudyTask: (task: AssignmentTask) => void;
  onStartBossBattle?: (task: AssignmentTask) => void;
}

const EXAM_TITLE_PATTERN = /\b(quiz|test|exam|midterm|final|assessment)\b/i;

export const DueNextBanner: React.FC<DueNextBannerProps> = ({
  tasks,
  onStudyTask,
  onStartBossBattle,
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = getNextUpcomingAssignments(tasks, 3, now);

  if (upcoming.length === 0) {
    return (
      <div className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm text-slate-300">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
          <span>All caught up! No urgent Canvas due dates in the queue.</span>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Due Next Live Countdowns"
      className="hud-corners hud-blue rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/65 to-indigo-950/60 backdrop-blur-md border border-blue-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_36px_rgba(37,99,235,0.16)] p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.9)]"
            aria-hidden="true"
          />
          <Clock className="w-4 h-4 text-blue-400" aria-hidden="true" />
          <h2 className="font-display font-semibold text-sm text-blue-200">
            Due Next — Live Canvas Countdowns
          </h2>
        </div>
        <span className="font-mono-nums text-xs text-indigo-300">
          Next {upcoming.length} deadlines
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {upcoming.map((task) => {
          const countdown = formatCountdownLabel(task.dueDate, now);
          const isUrgent = new Date(task.dueDate).getTime() - now.getTime() < 24 * 60 * 60 * 1000;
          const isExam = EXAM_TITLE_PATTERN.test(task.title);
          return (
            <div
              key={task.id}
              className={`rounded-xl bg-slate-950/70 backdrop-blur-md border px-3.5 py-3 flex flex-col justify-between gap-2.5 transition-all hover:-translate-y-0.5 ${
                isUrgent
                  ? 'border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                  : 'border-blue-400/25 hover:border-blue-400/50'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs text-indigo-300 font-medium truncate">
                  {task.className}
                </div>
                <div className="text-sm font-semibold text-white truncate mt-0.5">
                  {task.title}
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 font-mono-nums text-xs font-semibold mt-1 ${
                    isUrgent
                      ? 'text-amber-300 telemetry-glow-amber'
                      : 'text-blue-300 telemetry-glow-blue'
                  }`}
                >
                  {isUrgent && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                      aria-hidden="true"
                    />
                  )}
                  <span>{countdown}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onStudyTask(task)}
                  aria-label={`Study ${task.title} in AI Hub`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/35 text-blue-200 border border-blue-400/35 transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>Study</span>
                </button>
                {onStartBossBattle && isExam && (
                  <button
                    type="button"
                    onClick={() => onStartBossBattle(task)}
                    data-testid={`due-next-boss-${task.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500/25 to-rose-500/25 hover:brightness-125 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.18)] transition-all whitespace-nowrap"
                  >
                    <Swords className="w-3 h-3 text-amber-300" aria-hidden="true" />
                    <span>Boss Battle</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
