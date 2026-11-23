import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Sparkles, Flame } from 'lucide-react';
import { StudyCityState } from '../types/app';
import { computeStudyQuests, StudyQuestDefinition } from '../utils/cityAndQuests';
import { focusAudioEngine } from '../utils/focusAudio';

interface QuestBoardProps {
  city: StudyCityState;
  onClaimQuest: (questId: StudyQuestDefinition['id']) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ city, onClaimQuest }) => {
  const quests = useMemo(() => computeStudyQuests(city), [city]);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [justClaimedMsg, setJustClaimedMsg] = useState<string | null>(null);

  const handleClaim = (quest: StudyQuestDefinition) => {
    if (!quest.canClaim) return;
    onClaimQuest(quest.id);
    focusAudioEngine.playSuccessChime();
    setCelebratingId(quest.id);
    setJustClaimedMsg(
      `Claimed +${quest.rewardAmount} ${quest.rewardType === 'bricks' ? 'Bricks' : 'Blueprints'}!`
    );
    setTimeout(() => {
      setCelebratingId((cur) => (cur === quest.id ? null : cur));
    }, 1500);
    setTimeout(() => {
      setJustClaimedMsg(null);
    }, 3000);
  };

  return (
    <section
      aria-label="Canvas-Linked Daily and Weekly Quest Board"
      data-testid="quest-board"
      className="hud-corners hud-amber rounded-2xl bg-slate-900/65 backdrop-blur-md border border-amber-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 sm:p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-300" aria-hidden="true" />
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white">
                Study Quest Board
              </h2>
              <p className="text-xs text-slate-400">
                Canvas-linked daily &amp; weekly city missions
              </p>
            </div>
          </div>
          <span className="font-mono-nums text-[11px] font-semibold text-amber-300 whitespace-nowrap shrink-0">
            {quests.filter((q) => q.claimed).length}/{quests.length} Claimed
          </span>
        </div>

        {justClaimedMsg && (
          <div
            data-testid="quest-claim-toast"
            className="rounded-xl bg-emerald-500/20 border border-emerald-400/45 px-3 py-2 text-xs font-semibold text-emerald-200 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
            <span>{justClaimedMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-1 gap-3">
          {quests.map((quest) => {
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
            const isCelebrating = celebratingId === quest.id;

            return (
              <div
                key={quest.id}
                data-testid={`quest-card-${quest.id}`}
                className={`relative overflow-hidden rounded-xl border p-3.5 space-y-2.5 transition-all ${
                  quest.claimed
                    ? 'bg-emerald-950/25 border-emerald-400/30 opacity-85'
                    : quest.canClaim
                      ? 'bg-amber-950/25 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                      : 'bg-slate-950/70 border-white/10 hover:border-white/25'
                }`}
              >
                {/* Confetti Burst Overlay on Claim */}
                {isCelebrating && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
                  >
                    <span className="confetti-burst-dot bg-amber-300" style={{ '--tx': '-48px', '--ty': '-28px' } as React.CSSProperties} />
                    <span className="confetti-burst-dot bg-cyan-300" style={{ '--tx': '44px', '--ty': '-32px' } as React.CSSProperties} />
                    <span className="confetti-burst-dot bg-emerald-300" style={{ '--tx': '-28px', '--ty': '26px' } as React.CSSProperties} />
                    <span className="confetti-burst-dot bg-rose-300" style={{ '--tx': '32px', '--ty': '24px' } as React.CSSProperties} />
                    <span className="confetti-burst-dot bg-indigo-300" style={{ '--tx': '0px', '--ty': '-40px' } as React.CSSProperties} />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono-nums">
                      <span
                        className={
                          quest.cadence === 'Daily' ? 'text-cyan-300 font-semibold' : 'text-indigo-300 font-semibold'
                        }
                      >
                        {quest.cadence} Quest
                      </span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-amber-300 font-semibold">
                        +{quest.rewardAmount}{' '}
                        {quest.rewardType === 'bricks' ? 'Bricks' : 'Blueprints'}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-sm text-white mt-0.5">
                      {quest.title}
                    </h3>
                  </div>

                  <span className="font-mono-nums text-xs font-bold text-slate-200 shrink-0">
                    {quest.current}/{quest.target}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {quest.description}
                </p>

                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      quest.claimed || quest.canClaim
                        ? 'bg-gradient-to-r from-emerald-400 to-amber-300'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-end">
                  {quest.claimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Reward Claimed</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!quest.canClaim}
                      onClick={() => handleClaim(quest)}
                      data-testid={`claim-quest-${quest.id}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        quest.canClaim
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 hover:brightness-110 shadow-md'
                          : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {quest.canClaim ? 'Claim Reward' : 'In Progress'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-slate-950/60 border border-white/10 px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span>Boss Battles Won:</span>
        </span>
        <strong className="font-mono-nums text-amber-300">
          {city.bossBattlesWon || 0} {city.championshipTrophyUnlocked ? '· Trophy Active' : ''}
        </strong>
      </div>
    </section>
  );
};
