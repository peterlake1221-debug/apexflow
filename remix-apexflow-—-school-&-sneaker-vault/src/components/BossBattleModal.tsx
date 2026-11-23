import React, { useEffect, useState } from 'react';
import {
  Swords,
  Trophy,
  X,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AssignmentTask, PracticeTestQuestion } from '../types/app';
import { focusAudioEngine } from '../utils/focusAudio';

interface BossBattleModalProps {
  open: boolean;
  targetTask: AssignmentTask | null;
  studyTitle: string;
  studyNotes: string;
  onClose: () => void;
  onVictory: () => void;
}

export const BossBattleModal: React.FC<BossBattleModalProps> = ({
  open,
  targetTask,
  studyTitle,
  studyNotes,
  onClose,
  onVictory,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeTestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [victoryClaimed, setVictoryClaimed] = useState(false);

  const battleTitle = targetTask
    ? `${targetTask.className}: ${targetTask.title}`
    : studyTitle || 'Upcoming Exam Boss';

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(45 * 60);
    setTimerRunning(true);
    setAnswers({});
    setSubmitted(false);
    setVictoryClaimed(false);
    setQuizError(null);
  }, [open, battleTitle]);

  useEffect(() => {
    if (!open || !timerRunning) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [open, timerRunning]);

  const handleGenerate10Questions = async () => {
    setLoadingQuiz(true);
    setQuizError(null);
    setSubmitted(false);
    setAnswers({});
    try {
      const payloadNotes = targetTask?.notes
        ? `${targetTask.className} — ${targetTask.title}\n\n${targetTask.notes}\n\n${studyNotes}`
        : studyNotes;
      const res = await fetch('/api/ai/boss-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: battleTitle, notes: payloadNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate 10-question Boss Battle quiz.');
      }
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : 'Boss quiz generation failed.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  if (!open) return null;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const correctCount = questions.filter((q) => {
    const given = (answers[q.id] || '').trim().toLowerCase();
    return given === q.correctAnswer.trim().toLowerCase();
  }).length;
  const totalQ = questions.length;
  const scorePct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const bossHpPct = submitted && totalQ > 0 ? Math.max(0, 100 - scorePct) : 100;
  const bossDefeated = submitted && totalQ > 0 && scorePct >= 70;

  const handleClaimVictory = () => {
    if (victoryClaimed) return;
    setVictoryClaimed(true);
    setTimerRunning(false);
    focusAudioEngine.playSuccessChime();
    onVictory();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boss Battle Exam Mode"
      data-testid="boss-battle-modal"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#090D16] border border-amber-400/50 shadow-[0_24px_90px_rgba(245,158,11,0.28)] text-white overflow-hidden">
        {/* Top Boss Header */}
        <div className="px-6 py-4 border-b border-amber-400/25 bg-gradient-to-r from-rose-950/60 via-[#090D16] to-amber-950/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 shrink-0 shadow-lg">
              <Swords className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-mono-nums uppercase tracking-wider text-amber-300">
                Boss Battle Exam Mode · +250 XP &amp; Trophy Monument
              </div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white truncate">
                {battleTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-xl bg-slate-950 border border-amber-400/40 px-3 py-1.5 flex items-center gap-2">
              <span className="font-mono-nums text-lg font-bold text-amber-300">
                {mins}:{secs}
              </span>
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                aria-label={timerRunning ? 'Pause Boss timer' : 'Resume Boss timer'}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Boss Battle"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Boss HP Strip */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-[220px] space-y-1">
            <div className="flex items-center justify-between text-xs font-mono-nums">
              <span className="text-rose-300 font-semibold">
                Exam Boss HP {submitted ? `(${bossHpPct}%)` : '(100%)'}
              </span>
              <span className="text-slate-400">Score &ge; 70% on 10 questions to defeat</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500"
                style={{ width: `${bossHpPct}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate10Questions}
            disabled={loadingQuiz}
            data-testid="generate-boss-quiz-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white hover:brightness-110 disabled:opacity-50 transition-all shrink-0"
          >
            {loadingQuiz ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span>
              {loadingQuiz
                ? 'Summoning 10 Boss Questions...'
                : questions.length > 0
                  ? 'Regenerate 10-Question Quiz'
                  : 'Generate 10-Question Boss Quiz'}
            </span>
          </button>
        </div>

        {/* Quiz Arena */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {quizError && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{quizError}</span>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8 text-center space-y-3">
              <Trophy className="w-10 h-10 text-amber-300 mx-auto" aria-hidden="true" />
              <h3 className="font-display font-bold text-base text-white">
                45-Minute Deep Focus + 10-Question AI Boss Gauntlet
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                Your 45:00 deep focus countdown is active. Click &ldquo;Generate 10-Question Boss Quiz&rdquo; above to pull 10 practice exam questions from your notes and defeat the Exam Boss for a permanent Championship Trophy Monument in your Study City.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const chosen = answers[q.id] || '';
                const isCorrect =
                  chosen.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-slate-900/75 border border-white/10 p-4 space-y-3"
                  >
                    <div className="text-xs font-mono-nums text-amber-300">
                      Boss Question {idx + 1} / {questions.length}
                    </div>
                    <div className="text-sm font-semibold text-white">{q.prompt}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.options || []).map((opt) => {
                        const selected = chosen === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={submitted}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                            }
                            className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                              selected
                                ? 'bg-amber-500/25 border-amber-400 text-white'
                                : 'bg-slate-950/75 border-white/10 text-slate-300 hover:border-white/30'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div
                        className={`rounded-lg px-3 py-2 text-xs border ${
                          isCorrect
                            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                            : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
                        }`}
                      >
                        <div className="font-semibold">
                          {isCorrect ? 'Direct Hit!' : `Missed — Correct: ${q.correctAnswer}`}
                        </div>
                        <p className="text-slate-300 mt-0.5">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {submitted ? (
                  <>
                    <div className="text-sm font-mono-nums">
                      Final Boss Score:{' '}
                      <strong className={bossDefeated ? 'text-emerald-300' : 'text-rose-300'}>
                        {correctCount}/{totalQ} ({scorePct}%)
                      </strong>
                    </div>
                    {bossDefeated ? (
                      victoryClaimed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Trophy Monument Placed in Your Study City!</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleClaimVictory}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 hover:brightness-110"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>Claim Boss Victory (+250 XP &amp; Trophy Monument)</span>
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setAnswers({});
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Retry Boss Quiz
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSubmitted(true)}
                    className="ml-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:brightness-110"
                  >
                    Submit Boss Challenge
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
