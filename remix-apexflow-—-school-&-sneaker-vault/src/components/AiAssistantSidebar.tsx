import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  CalendarClock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { AppMode, AssignmentTask, ChatMessage, SneakerPair } from '../types/app';
import { computeInventorySummary } from '../utils/sneakerMath';

interface AiAssistantSidebarProps {
  open: boolean;
  mode: AppMode;
  onCloseMobile: () => void;
  studyTitle: string;
  studyNotes: string;
  tasks: AssignmentTask[];
  sneakers: SneakerPair[];
}

export const AiAssistantSidebar: React.FC<AiAssistantSidebarProps> = ({
  open,
  mode,
  onCloseMobile,
  studyTitle,
  studyNotes,
  tasks,
  sneakers,
}) => {
  const [schoolMessages, setSchoolMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-school',
      role: 'assistant',
      content:
        'Kova AI · School Tutor ready. Use a quick prompt above to run Gizmo active-recall quiz mode on your notes or schedule your Canvas deadlines.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [inventoryMessages, setInventoryMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-inventory',
      role: 'assistant',
      content:
        'Kova AI · Inventory Analyst ready. Query your margins, stale stock over 14–30 days, break-even targets, or capital tied up.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isSchool = mode === 'school';
  const activeMessages = isSchool ? schoolMessages : inventoryMessages;
  const setActiveMessages = isSchool ? setSchoolMessages : setInventoryMessages;

  const sendMessage = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [...activeMessages, userMsg];
    setActiveMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const contextPayload = isSchool
        ? {
            studyTitle,
            studyNotes,
            upcomingTasks: tasks
              .filter((t) => t.status !== 'Done')
              .slice(0, 8)
              .map((t) => ({
                className: t.className,
                title: t.title,
                dueDate: t.dueDate,
                status: t.status,
              })),
          }
        : {
            inventorySummary: computeInventorySummary(sneakers),
            sneakers: sneakers.map((s) => ({
              modelName: s.modelName,
              size: s.size,
              status: s.status,
              buyPrice: s.buyPrice,
              soldPrice: s.soldPrice,
              feePercent: s.feePercent,
              purchaseDate: s.purchaseDate,
            })),
          };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          message: trimmed,
          history: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          context: contextPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kova AI could not respond.');
      }

      setActiveMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setActiveMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? `Note: ${err.message}`
              : 'Unable to reach Kova AI.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <aside
      aria-label={isSchool ? 'Kova AI School Tutor' : 'Kova AI Inventory Analyst'}
      className={`fixed inset-y-0 right-0 z-40 w-80 xl:w-88 flex flex-col bg-slate-950/80 backdrop-blur-md border-l lg:static ${
        isSchool ? 'border-blue-500/25' : 'border-emerald-500/25'
      }`}
    >
      {/* Glowing Header Bar with Live Status Pulse Dots */}
      <div
        className={`relative h-16 px-4 border-b flex items-center justify-between shrink-0 overflow-hidden ${
          isSchool
            ? 'border-blue-500/25 bg-gradient-to-r from-blue-950/55 via-slate-950/80 to-indigo-950/45'
            : 'border-emerald-500/25 bg-gradient-to-r from-emerald-950/55 via-slate-950/80 to-cyan-950/45'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/images/logo_kova_ai_1795360359566.jpg"
            alt="Kova AI logo"
            referrerPolicy="no-referrer"
            className={`w-8 h-8 rounded-lg object-cover border shrink-0 ${
              isSchool ? 'border-blue-400/50' : 'border-emerald-400/50'
            }`}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-white leading-tight">
                Kova AI
              </span>
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isSchool
                    ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                }`}
                aria-hidden="true"
              />
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono-nums font-semibold uppercase tracking-wider block ${
                isSchool ? 'text-blue-300' : 'text-emerald-300'
              }`}
            >
              <span>{isSchool ? 'SCHOOL TUTOR MODE' : 'INVENTORY ANALYST MODE'}</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close AI Assistant"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Futuristic Prompt Chips with Hover Light-Trails */}
      <div className="p-3 border-b border-white/10 space-y-2 shrink-0">
        {isSchool ? (
          <>
            <button
              type="button"
              onClick={() =>
                sendMessage(
                  'Quiz me on my notes (Gizmo mode): ask me one challenging active-recall question from my current study notes and wait for my answer.'
                )
              }
              className="group w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 border border-blue-400/30 hover:border-blue-300/70 hover:shadow-[0_0_16px_rgba(59,130,246,0.22)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Quiz me on my notes (Gizmo mode)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                sendMessage(
                  'Create a study schedule from my Canvas due dates prioritized by urgency and difficulty.'
                )
              }
              className="group w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 hover:border-indigo-300/70 hover:shadow-[0_0_16px_rgba(129,140,248,0.22)] transition-all"
            >
              <CalendarClock className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Create a study schedule from my Canvas due dates</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                sendMessage(
                  'Analyze my sneaker inventory & profit margins: highlight net profit, ROI, and break-even targets.'
                )
              }
              className="group w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:border-emerald-300/70 hover:shadow-[0_0_16px_rgba(16,185,129,0.22)] transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Analyze sneaker inventory &amp; margins</span>
            </button>

            <button
              type="button"
              onClick={() =>
                sendMessage(
                  'Spot stale stock (14+ or 30+ days held) and recommend pricing moves to free up cash.'
                )
              }
              className="group w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:border-amber-300/70 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Spot stale stock &amp; pricing moves</span>
            </button>

            <button
              type="button"
              onClick={() =>
                sendMessage(
                  'Summarize capital tied up in hand vs cash freed from sold pairs and any logged losses.'
                )
              }
              className="group w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 hover:border-cyan-300/70 hover:shadow-[0_0_16px_rgba(6,182,212,0.22)] transition-all"
            >
              <DollarSign className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Summarize capital tied up vs. cash freed</span>
            </button>
          </>
        )}
      </div>

      {/* Terminal-Style Chat Bubbles */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {activeMessages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
              msg.role === 'user'
                ? isSchool
                  ? 'bg-blue-600/20 border border-blue-400/40 text-blue-50 ml-4'
                  : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-50 ml-4'
                : 'bg-slate-900/75 border border-white/10 text-slate-200 mr-2 font-sans'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            className={`flex items-center gap-2 text-xs font-mono-nums px-2 ${
              isSchool ? 'text-indigo-300' : 'text-emerald-300'
            }`}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/10 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isSchool
              ? 'Ask Kova about notes or deadlines...'
              : 'Ask Kova about margins, ROI, or stock...'
          }
          aria-label="Message AI Assistant"
          className={`flex-1 min-w-0 rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none ${
            isSchool ? 'focus:border-blue-400' : 'focus:border-emerald-400'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message to AI Assistant"
          className={`p-2 rounded-xl transition-all disabled:opacity-50 ${
            isSchool
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
