import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  CheckSquare,
  X,
  RotateCw,
  Loader2,
  Upload,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  AssignmentTask,
  GeneratedStudySet,
  StudyModeType,
} from '../types/app';

interface TheaStudyHubProps {
  tasks: AssignmentTask[];
  studyTitle: string;
  studyNotes: string;
  studySet: GeneratedStudySet | null;
  onChangeTitle: (val: string) => void;
  onChangeNotes: (val: string) => void;
  onUpdateStudySet: (next: GeneratedStudySet) => void;
  onRecordStudyActivity: (activityType: 'flashcard' | 'quiz', scorePercent?: number) => void;
}

export const TheaStudyHub: React.FC<TheaStudyHubProps> = ({
  tasks,
  studyTitle,
  studyNotes,
  studySet,
  onChangeTitle,
  onChangeNotes,
  onUpdateStudySet,
  onRecordStudyActivity,
}) => {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<StudyModeType>('smart-study');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Smart Study state
  const [smartFilter, setSmartFilter] = useState<'all' | 'still-learning'>('all');
  const [revealedSmartIds, setRevealedSmartIds] = useState<Record<string, boolean>>({});
  const [hintVisibleIds, setHintVisibleIds] = useState<Record<string, boolean>>({});

  // Flashcards state
  const [flashFilter, setFlashFilter] = useState<'all' | 'still-learning'>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Practice Test state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedTest, setSubmittedTest] = useState(false);
  const [missedOnlyMode, setMissedOnlyMode] = useState(false);

  const handleSelectCanvasAssignment = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (!found) return;
    onChangeTitle(`${found.className} — ${found.title}`);
    const content = found.notes
      ? `${found.className}: ${found.title}\n\n${found.notes}`
      : `Assignment: ${found.title} for ${found.className}. Due ${new Date(
          found.dueDate
        ).toLocaleString()}. Focus on core concepts, key formulas, definitions, and practice questions.`;
    onChangeNotes(content);
  };

  const handleUploadStudyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onChangeTitle(file.name.replace(/\.[^/.]+$/, ''));
    onChangeNotes(text.slice(0, 12000));
    e.target.value = '';
  };

  const handleGenerateWithAI = async () => {
    setErrorMsg(null);
    if (studyNotes.trim().length < 15) {
      setErrorMsg('Please paste class notes or select a Canvas assignment first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: studyTitle, notes: studyNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate study set.');
      }
      onUpdateStudySet(data as GeneratedStudySet);
      setRevealedSmartIds({});
      setHintVisibleIds({});
      setCardIndex(0);
      setFlipped(false);
      setAnswers({});
      setSubmittedTest(false);
      setMissedOnlyMode(false);
      setLauncherOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'AI generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModeFromLauncher = (mode: StudyModeType) => {
    setActiveMode(mode);
    setLauncherOpen(false);
  };

  const toggleSmartQuestionStatus = (id: string, nextStatus: 'still-learning' | 'mastered') => {
    if (!studySet) return;
    const prev = studySet.smartStudy.find((q) => q.id === id);
    if (nextStatus === 'mastered' && prev?.status !== 'mastered') {
      onRecordStudyActivity('flashcard');
    }
    onUpdateStudySet({
      ...studySet,
      smartStudy: studySet.smartStudy.map((q) =>
        q.id === id ? { ...q, status: nextStatus } : q
      ),
    });
  };

  const toggleFlashcardStatus = (id: string, nextStatus: 'still-learning' | 'mastered') => {
    if (!studySet) return;
    const prev = studySet.flashcards.find((f) => f.id === id);
    if (nextStatus === 'mastered' && prev?.status !== 'mastered') {
      onRecordStudyActivity('flashcard');
    }
    onUpdateStudySet({
      ...studySet,
      flashcards: studySet.flashcards.map((f) =>
        f.id === id ? { ...f, status: nextStatus } : f
      ),
    });
  };

  const visibleSmartQuestions = (studySet?.smartStudy || []).filter((q) =>
    smartFilter === 'still-learning' ? q.status === 'still-learning' : true
  );

  const visibleFlashcards = (studySet?.flashcards || []).filter((f) =>
    flashFilter === 'still-learning' ? f.status === 'still-learning' : true
  );
  const safeCardIndex =
    visibleFlashcards.length > 0 ? cardIndex % visibleFlashcards.length : 0;
  const activeFlashcard = visibleFlashcards[safeCardIndex];

  const allTestQuestions = studySet?.practiceTest || [];
  const missedQuestions = allTestQuestions.filter((q) => {
    const given = (answers[q.id] || '').trim().toLowerCase();
    return given !== q.correctAnswer.trim().toLowerCase();
  });
  const activeTestQuestions = missedOnlyMode ? missedQuestions : allTestQuestions;

  const correctCount = allTestQuestions.filter((q) => {
    const given = (answers[q.id] || '').trim().toLowerCase();
    return given === q.correctAnswer.trim().toLowerCase();
  }).length;

  const smartMasteredCount = (studySet?.smartStudy || []).filter(
    (q) => q.status === 'mastered'
  ).length;
  const smartTotalCount = studySet?.smartStudy.length || 0;
  const smartMasteryPct =
    smartTotalCount > 0 ? Math.round((smartMasteredCount / smartTotalCount) * 100) : 0;

  const flashMasteredCount = (studySet?.flashcards || []).filter(
    (f) => f.status === 'mastered'
  ).length;
  const flashTotalCount = studySet?.flashcards.length || 0;
  const flashMasteryPct =
    flashTotalCount > 0 ? Math.round((flashMasteredCount / flashTotalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Input / Source Material Card */}
      <section className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(37,99,235,0.12)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              Thea-Style AI Study Hub
            </h1>
            <p className="text-sm text-slate-400">
              Paste notes, upload a study guide, or pick a Canvas assignment to launch Smart Study, Study Guide, Flashcards, or Practice Tests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span>Upload Notes (.txt/.md)</span>
              <input
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleUploadStudyFile}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setLauncherOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open Study Launcher</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="study-title-input" className="block text-xs text-slate-400 mb-1">
              Study Set Title
            </label>
            <input
              id="study-title-input"
              type="text"
              value={studyTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              className="w-full rounded-lg bg-[#090d16] border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="canvas-task-picker" className="block text-xs text-slate-400 mb-1">
              Or Pick a Canvas Assignment
            </label>
            <select
              id="canvas-task-picker"
              defaultValue=""
              onChange={(e) => handleSelectCanvasAssignment(e.target.value)}
              className="w-full rounded-lg bg-[#090d16] border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Select an assignment to load...
              </option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.className}] {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="study-notes-textarea" className="block text-xs text-slate-400 mb-1">
            Class Notes / Study Guide Material
          </label>
          <textarea
            id="study-notes-textarea"
            rows={5}
            value={studyNotes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Paste lecture notes, textbook outlines, or Canvas module text..."
            className="w-full rounded-lg bg-[#090d16] border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-blue-500"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#090d16] border border-slate-800">
            {(
              [
                { id: 'smart-study', label: 'Smart Study' },
                { id: 'study-guide', label: 'Study Guide' },
                { id: 'flashcards', label: 'Flashcards' },
                { id: 'test', label: 'Practice Test' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeMode === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white transition-all whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{loading ? 'Generating AI Study Modes...' : 'Generate AI Study Set'}</span>
          </button>
        </div>
      </section>

      {/* Thea-Style 2x2 Card Selector Modal */}
      {launcherOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thea-Style Study Mode Selector"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="hud-corners hud-blue w-full max-w-2xl rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-blue-400/40 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(37,99,235,0.28)]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" aria-hidden="true" />
                <h2 className="font-display font-bold text-lg text-white">
                  Choose Your Study Mode
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLauncherOpen(false)}
                aria-label="Close study mode selector"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Smart Study (Recommended) */}
              <button
                type="button"
                onClick={() => handleSelectModeFromLauncher('smart-study')}
                className="group text-left hud-corners hud-blue rounded-xl bg-slate-950/75 border border-blue-500/60 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(59,130,246,0.22)] p-5 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-400" aria-hidden="true" />
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/35">
                    Recommended
                  </span>
                </div>
                <div className="font-display font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                  Smart Study
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Answer personalized questions powered by AI
                </p>
              </button>

              {/* 2. Study Guide */}
              <button
                type="button"
                onClick={() => handleSelectModeFromLauncher('study-guide')}
                className="group text-left hud-corners hud-indigo rounded-xl bg-slate-950/75 border border-indigo-500/30 hover:border-indigo-400/80 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(99,102,241,0.2)] p-5 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                </div>
                <div className="font-display font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                  Study Guide
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Generate a study guide or summarize your materials
                </p>
              </button>

              {/* 3. Flashcards */}
              <button
                type="button"
                onClick={() => handleSelectModeFromLauncher('flashcards')}
                className="group text-left hud-corners hud-cyan rounded-xl bg-slate-950/75 border border-cyan-500/30 hover:border-cyan-400/80 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(34,211,238,0.18)] p-5 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Layers className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                </div>
                <div className="font-display font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                  Flashcards
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Flashcards and games if only definitions matter
                </p>
              </button>

              {/* 4. Test */}
              <button
                type="button"
                onClick={() => handleSelectModeFromLauncher('test')}
                className="group text-left hud-corners hud-indigo rounded-xl bg-slate-950/75 border border-indigo-500/30 hover:border-indigo-400/80 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(99,102,241,0.2)] p-5 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <CheckSquare className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                </div>
                <div className="font-display font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                  Test
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Challenge yourself with a practice test
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Study Mode Workspace */}
      {!studySet ? (
        <div className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/20 p-8 text-center text-sm text-slate-400">
          Paste your notes above and click &ldquo;Generate AI Study Set&rdquo; to begin practicing.
        </div>
      ) : activeMode === 'smart-study' ? (
        <section className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(15,23,42,0.45)] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Smart Study · {studySet.sourceTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Adaptive Q&amp;A · Track concepts you still need to drill
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#090d16] border border-slate-800">
              <button
                type="button"
                onClick={() => setSmartFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  smartFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({studySet.smartStudy.length})
              </button>
              <button
                type="button"
                onClick={() => setSmartFilter('still-learning')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  smartFilter === 'still-learning'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Still Learning (
                {studySet.smartStudy.filter((q) => q.status === 'still-learning').length})
              </button>
            </div>
          </div>

          {/* Mastery Progress Bar */}
          <div className="rounded-xl bg-slate-950/65 border border-blue-500/20 px-3.5 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono-nums">
              <span className="text-slate-300">
                Smart Study Mastery: <strong className="text-blue-300">{smartMasteredCount} / {smartTotalCount}</strong>
              </span>
              <span className="text-blue-300 font-bold telemetry-glow-blue">{smartMasteryPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${smartMasteryPct}%` }}
              />
            </div>
          </div>

          {visibleSmartQuestions.length === 0 ? (
            <p className="text-sm text-emerald-300 py-6 text-center">
              You mastered all Smart Study questions in this set! Switch to All to review.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleSmartQuestions.map((q, idx) => {
                const isRevealed = Boolean(revealedSmartIds[q.id]);
                const showHint = Boolean(hintVisibleIds[q.id]);
                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-[#0b1120] border border-slate-800/90 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-blue-300 font-medium">
                        Question {idx + 1} · {q.topic}
                      </span>
                      <span
                        className={
                          q.status === 'mastered' ? 'text-emerald-400' : 'text-amber-300'
                        }
                      >
                        {q.status === 'mastered' ? 'Mastered' : 'Still Learning'}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white leading-relaxed">
                      {q.question}
                    </div>

                    {showHint && (
                      <div className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 rounded-lg px-3 py-2">
                        Hint: {q.hint}
                      </div>
                    )}

                    {isRevealed && (
                      <div className="rounded-lg bg-blue-950/35 border border-blue-500/30 p-3 space-y-1">
                        <div className="text-sm font-semibold text-blue-200">
                          Answer: {q.answer}
                        </div>
                        <p className="text-xs text-slate-300">{q.explanation}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setHintVisibleIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                          }
                          className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {showHint ? 'Hide Hint' : 'Show Hint'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedSmartIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                          }
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/35"
                        >
                          {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSmartQuestionStatus(q.id, 'still-learning')}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                            q.status === 'still-learning'
                              ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          Still Learning
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSmartQuestionStatus(q.id, 'mastered')}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                            q.status === 'mastered'
                              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          Mastered
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : activeMode === 'study-guide' ? (
        <section className="hud-corners hud-indigo rounded-2xl bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(15,23,42,0.45)] p-6 space-y-6">
          {studySet.studyGuide ? (
            <>
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  {studySet.studyGuide.title}
                </h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {studySet.studyGuide.overview}
                </p>
              </div>

              <div>
                <h3 className="font-display font-semibold text-sm text-blue-300 mb-3">
                  Key Takeaways &amp; Concepts
                </h3>
                <ul className="space-y-2">
                  {studySet.studyGuide.keyPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg bg-[#0b1120] border border-slate-800 px-4 py-2.5 text-sm text-slate-200"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display font-semibold text-sm text-indigo-300 mb-3">
                  Key Vocabulary Definitions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studySet.studyGuide.vocabulary.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-[#0b1120] border border-slate-800 p-3.5"
                    >
                      <div className="font-semibold text-sm text-white">{item.term}</div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No study guide generated yet.</p>
          )}
        </section>
      ) : activeMode === 'flashcards' ? (
        <section className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(15,23,42,0.45)] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Flashcards · {studySet.sourceTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Click card to flip · Track Still Learning vs Mastered
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#090d16] border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFlashFilter('all');
                  setCardIndex(0);
                  setFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  flashFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Cards ({studySet.flashcards.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlashFilter('still-learning');
                  setCardIndex(0);
                  setFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  flashFilter === 'still-learning'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Still Learning Filter (
                {studySet.flashcards.filter((f) => f.status === 'still-learning').length})
              </button>
            </div>
          </div>

          {/* Flashcard Mastery Bar */}
          <div className="rounded-xl bg-slate-950/65 border border-cyan-500/20 px-3.5 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono-nums">
              <span className="text-slate-300">
                Flashcards Mastered: <strong className="text-cyan-300">{flashMasteredCount} / {flashTotalCount}</strong>
              </span>
              <span className="text-cyan-300 font-bold telemetry-glow-cyan">{flashMasteryPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${flashMasteryPct}%` }}
              />
            </div>
          </div>

          {!activeFlashcard ? (
            <div className="py-10 text-center text-sm text-emerald-300">
              All flashcards are marked Mastered! Switch back to All Cards to review.
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-4">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="w-full h-56 [perspective:1000px] text-left focus:outline-none"
                aria-label="Flip flashcard"
              >
                <div
                  className={`flip-card-inner relative w-full h-full ${
                    flipped ? 'is-flipped' : ''
                  }`}
                >
                  {/* Front */}
                  <div className="flip-card-face absolute inset-0 rounded-2xl bg-[#0b1120] border border-blue-500/40 p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Term / Prompt</span>
                      <span className="font-mono-nums">
                        {safeCardIndex + 1} / {visibleFlashcards.length}
                      </span>
                    </div>
                    <div className="text-center font-display font-bold text-xl text-white">
                      {activeFlashcard.front}
                    </div>
                    <div className="text-center text-xs text-blue-400 flex items-center justify-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Click to flip</span>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="flip-card-face flip-card-back absolute inset-0 rounded-2xl bg-indigo-950/60 border border-indigo-400/50 p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-indigo-300">
                      <span>Definition / Answer</span>
                      <span>
                        {activeFlashcard.status === 'mastered' ? 'Mastered' : 'Still Learning'}
                      </span>
                    </div>
                    <div className="text-center text-base font-medium text-white leading-relaxed">
                      {activeFlashcard.back}
                    </div>
                    <div className="text-center text-xs text-indigo-300">
                      Click to see front
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCardIndex(
                        (prev) =>
                          (prev - 1 + visibleFlashcards.length) % visibleFlashcards.length
                      );
                      setFlipped(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardIndex((prev) => (prev + 1) % visibleFlashcards.length);
                      setFlipped(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Next Card
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toggleFlashcardStatus(activeFlashcard.id, 'still-learning')
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      activeFlashcard.status === 'still-learning'
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Still Learning
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleFlashcardStatus(activeFlashcard.id, 'mastered');
                      setFlipped(false);
                      setCardIndex((prev) => prev + 1);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      activeFlashcard.status === 'mastered'
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                        : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mastered</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Practice Test Mode */
        <section className="hud-corners hud-indigo rounded-2xl bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(15,23,42,0.45)] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Practice Test · {studySet.sourceTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Multiple-choice &amp; fill-in-the-blank with instant explanations
              </p>
            </div>

            {submittedTest && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-nums text-sm font-bold text-blue-300">
                  Score: {correctCount} / {allTestQuestions.length} (
                  {allTestQuestions.length > 0
                    ? Math.round((correctCount / allTestQuestions.length) * 100)
                    : 0}
                  %)
                </span>

                {missedQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMissedOnlyMode((m) => !m);
                      setSubmittedTest(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40"
                  >
                    {missedOnlyMode
                      ? 'Show All Questions'
                      : `Quiz Missed-Question Drill (${missedQuestions.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          {activeTestQuestions.length === 0 ? (
            <p className="text-sm text-emerald-300 py-6 text-center">
              Zero missed questions! Perfect score.
            </p>
          ) : (
            <div className="space-y-4">
              {activeTestQuestions.map((q, idx) => {
                const userAns = answers[q.id] || '';
                const isCorrect =
                  userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-[#0b1120] border border-slate-800 p-4 space-y-3"
                  >
                    <div className="text-xs text-indigo-300 font-medium">
                      Question {idx + 1} ·{' '}
                      {q.type === 'fill-blank' ? 'Fill in the Blank' : 'Multiple Choice'}
                    </div>
                    <div className="text-sm font-semibold text-white">{q.prompt}</div>

                    {q.type === 'multiple-choice' && q.options ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const selected = userAns === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={submittedTest}
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                              }
                              className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                                selected
                                  ? 'bg-blue-600/25 border-blue-400 text-white'
                                  : 'bg-[#0f1624] border-slate-800 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled={submittedTest}
                        value={userAns}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Type your answer..."
                        className="w-full max-w-md rounded-lg bg-[#0f1624] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    )}

                    {submittedTest && (
                      <div
                        className={`rounded-lg px-3.5 py-2.5 text-xs border ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                            : 'bg-red-500/10 border-red-500/35 text-red-200'
                        }`}
                      >
                        <div className="font-semibold">
                          {isCorrect
                            ? 'Correct!'
                            : `Incorrect — Answer: ${q.correctAnswer}`}
                        </div>
                        <p className="text-slate-300 mt-1">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-3">
                {submittedTest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedTest(false);
                      setMissedOnlyMode(false);
                      setAnswers({});
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    Retake Full Test
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const pct =
                        allTestQuestions.length > 0
                          ? Math.round((correctCount / allTestQuestions.length) * 100)
                          : 0;
                      setSubmittedTest(true);
                      onRecordStudyActivity('quiz', pct);
                    }}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Grade Practice Test
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
