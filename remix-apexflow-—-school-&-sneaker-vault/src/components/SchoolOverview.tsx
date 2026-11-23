import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Swords,
} from 'lucide-react';
import {
  AssignmentTask,
  PriorityLevel,
  StudyProgressStats,
  TaskStatus,
} from '../types/app';
import { getTaskUrgency } from '../utils/studyAndGrades';
import { AnimatedNumber } from './AnimatedNumber';
import { DueNextBanner } from './DueNextBanner';

const EXAM_TASK_REGEX = /\b(quiz|test|exam|midterm|final|assessment)\b/i;

interface SchoolOverviewProps {
  tasks: AssignmentTask[];
  studyStats: StudyProgressStats;
  onStartBossBattle: (task?: AssignmentTask | null) => void;
  onAddTask: (task: Omit<AssignmentTask, 'id'>) => void;
  onUpdateTask: (task: AssignmentTask) => void;
  onDeleteTask: (id: string) => void;
  onStudyTask: (task: AssignmentTask) => void;
}

export const SchoolOverview: React.FC<SchoolOverviewProps> = ({
  tasks,
  studyStats,
  onStartBossBattle,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onStudyTask,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | PriorityLevel>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<AssignmentTask | null>(null);

  const [className, setClassName] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openNewForm = () => {
    setEditingTask(null);
    setClassName('');
    setTitle('');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setDueDate(tomorrow.toISOString().slice(0, 16));
    setPriority('Medium');
    setStatus('To Do');
    setNotes('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (task: AssignmentTask) => {
    setEditingTask(task);
    setClassName(task.className);
    setTitle(task.title);
    const localDt = new Date(task.dueDate);
    const formatted = Number.isNaN(localDt.getTime())
      ? ''
      : new Date(localDt.getTime() - localDt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
    setDueDate(formatted);
    setPriority(task.priority);
    setStatus(task.status);
    setNotes(task.notes ?? '');
    setFormError(null);
    setShowForm(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !title.trim() || !dueDate) {
      setFormError('Class Name, Assignment Title, and Due Date are required.');
      return;
    }
    const isoDue = new Date(dueDate).toISOString();
    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        className: className.trim(),
        title: title.trim(),
        dueDate: isoDue,
        priority,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      onAddTask({
        className: className.trim(),
        title: title.trim(),
        dueDate: isoDue,
        priority,
        status,
        source: 'manual',
        notes: notes.trim() || undefined,
      });
    }
    setShowForm(false);
  };

  const filteredTasks = [...tasks]
    .filter((t) => (statusFilter === 'All' ? true : t.status === statusFilter))
    .filter((t) => (priorityFilter === 'All' ? true : t.priority === priorityFilter))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const todoCount = tasks.filter((t) => t.status === 'To Do').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const overdueCount = tasks.filter(
    (t) => getTaskUrgency(t.dueDate, t.status) === 'overdue'
  ).length;

  return (
    <div className="space-y-6">
      <DueNextBanner
        tasks={tasks}
        onStudyTask={onStudyTask}
        onStartBossBattle={(t) => onStartBossBattle(t)}
      />

      {/* School KPI HUD Strip */}
      <section
        aria-label="Academic Task Summary"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Open Assignments</div>
          <div className="font-mono-nums text-2xl font-bold text-blue-300 telemetry-glow-blue mt-1">
            <AnimatedNumber value={todoCount + inProgressCount} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {inProgressCount} in progress
          </div>
        </div>
        <div className="hud-corners hud-rose rounded-2xl bg-slate-900/60 backdrop-blur-md border border-rose-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Overdue</div>
          <div className="font-mono-nums text-2xl font-bold text-rose-400 telemetry-glow-rose mt-1">
            <AnimatedNumber value={overdueCount} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs immediate focus</div>
        </div>
        <div className="hud-corners hud-indigo rounded-2xl bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Study Streak &amp; XP</div>
          <div className="font-mono-nums text-2xl font-bold text-amber-300 telemetry-glow-amber mt-1">
            🔥 <AnimatedNumber value={studyStats.streakDays} />d ·{' '}
            <AnimatedNumber value={studyStats.xp} formatLocale /> XP
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {studyStats.completedPomodoros} focus · {studyStats.completedQuizzes} quizzes · {doneCount} done
          </div>
        </div>
        <div className="hud-corners hud-cyan rounded-2xl bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 hover:-translate-y-0.5 transition-transform">
          <div className="text-xs text-slate-400">Canvas Synced</div>
          <div className="font-mono-nums text-2xl font-bold text-cyan-300 telemetry-glow-cyan mt-1">
            <AnimatedNumber value={tasks.filter((t) => t.source === 'canvas-ics').length} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">From .ics calendar feed</div>
        </div>
      </section>

      {/* Homework Board Header & Controls */}
      <section className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(15,23,42,0.45)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              Assignments &amp; Homework Board
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Synced with Canvas .ics feeds · Overdue items highlighted in red, due today in amber
            </p>
          </div>

          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-blue-600/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Assignment</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-white/10">
            {(['All', 'To Do', 'In Progress', 'Done'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="priority-filter" className="text-xs text-slate-400">
              Priority:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'All' | PriorityLevel)}
              className="rounded-lg bg-slate-950 border border-white/15 px-3 py-1.5 text-xs text-white"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No assignments found matching the current filter.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const urgency = getTaskUrgency(t.dueDate, t.status);
              const isExam = EXAM_TASK_REGEX.test(t.title) || EXAM_TASK_REGEX.test(t.className);

              return (
                <article
                  key={t.id}
                  className={`rounded-xl border p-4 transition-all ${
                    urgency === 'overdue'
                      ? 'bg-rose-950/25 border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.12)]'
                      : urgency === 'due-today'
                        ? 'bg-amber-950/25 border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.12)]'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {t.className}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            t.priority === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : t.priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                        {t.source === 'canvas-ics' && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-mono-nums">
                            Canvas Feed
                          </span>
                        )}
                        {isExam && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                            <Swords className="w-3 h-3 text-amber-400" aria-hidden="true" />
                            Exam / Quiz
                          </span>
                        )}
                      </div>

                      <h2 className="font-display font-bold text-base text-white">
                        {t.title}
                      </h2>

                      {t.notes && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {t.notes}
                        </p>
                      )}

                      <div className="text-xs font-mono-nums text-slate-400">
                        Due: {new Date(t.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onStudyTask(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-400/35 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                        <span>Study AI Hub</span>
                      </button>

                      {isExam && (
                        <button
                          type="button"
                          onClick={() => onStartBossBattle(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/45 transition-colors"
                        >
                          <Swords className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                          <span>Exam Boss Quiz</span>
                        </button>
                      )}

                      <select
                        aria-label={`Status for ${t.title}`}
                        value={t.status}
                        onChange={(e) =>
                          onUpdateTask({ ...t, status: e.target.value as TaskStatus })
                        }
                        className="rounded-lg bg-slate-900 border border-white/25 px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => openEditForm(t)}
                        aria-label={`Edit ${t.title}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(t.id)}
                        aria-label={`Delete ${t.title}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Add / Edit Modal */}
      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingTask ? 'Edit Assignment' : 'Add Assignment'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 p-6 shadow-2xl">
            <h2 className="font-display font-bold text-lg text-white mb-4">
              {editingTask ? 'Edit Assignment' : 'New Assignment'}
            </h2>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/35 px-3 py-2 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-class-name" className="block text-xs text-slate-400 mb-1">
                    Class Name *
                  </label>
                  <input
                    id="task-class-name"
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. AP Calculus BC"
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="task-title" className="block text-xs text-slate-400 mb-1">
                    Assignment Title *
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 4 Problem Set"
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="task-due-date" className="block text-xs text-slate-400 mb-1">
                    Due Date &amp; Time *
                  </label>
                  <input
                    id="task-due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm font-mono-nums text-white"
                  />
                </div>
                <div>
                  <label htmlFor="task-priority" className="block text-xs text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="task-status" className="block text-xs text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    id="task-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="task-notes" className="block text-xs text-slate-400 mb-1">
                  Notes / Description (Optional)
                </label>
                <textarea
                  id="task-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional instructions or rubric details..."
                  className="w-full rounded-lg bg-[#090d16] border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {editingTask ? 'Save Changes' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
