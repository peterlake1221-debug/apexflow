import React, { useState } from 'react';
import {
  Calculator,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { ClassLinkItem, CourseGrade } from '../types/app';
import {
  calculateNeededFinalScore,
  calculateWeightedGpaAverage,
} from '../utils/studyAndGrades';

interface GradesAndFocusViewProps {
  grades: CourseGrade[];
  classLinks: ClassLinkItem[];
  onAddGrade: (g: Omit<CourseGrade, 'id'>) => void;
  onUpdateGrade: (g: CourseGrade) => void;
  onDeleteGrade: (id: string) => void;
  onAddLink: (link: Omit<ClassLinkItem, 'id'>) => void;
  onDeleteLink: (id: string) => void;
}

export const GradesAndFocusView: React.FC<GradesAndFocusViewProps> = ({
  grades,
  classLinks,
  onAddGrade,
  onUpdateGrade,
  onDeleteGrade,
  onAddLink,
  onDeleteLink,
}) => {
  // New Course State
  const [courseName, setCourseName] = useState('');
  const [currentPercent, setCurrentPercent] = useState('88');
  const [finalWeight, setFinalWeight] = useState('20');
  const [targetPercent, setTargetPercent] = useState('90');

  // New Class Link State
  const [linkClass, setLinkClass] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkCat, setLinkCat] = useState<ClassLinkItem['category']>('Google Drive');

  const weightedAvg = calculateWeightedGpaAverage(grades);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    onAddGrade({
      courseName: courseName.trim(),
      credits: 1,
      currentPercent: Number(currentPercent) || 0,
      finalWeightPercent: Number(finalWeight) || 20,
      targetPercent: Number(targetPercent) || 90,
    });
    setCourseName('');
  };

  const handleAddClassLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkClass.trim() || !linkLabel.trim() || !linkUrl.trim()) return;
    const normalizedUrl =
      linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
        ? linkUrl.trim()
        : `https://${linkUrl.trim()}`;
    onAddLink({
      className: linkClass.trim(),
      label: linkLabel.trim(),
      url: normalizedUrl,
      category: linkCat,
    });
    setLinkClass('');
    setLinkLabel('');
    setLinkUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Grades & Final Exam Calculator */}
      <section className="hud-corners hud-blue rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(37,99,235,0.1)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <h1 className="font-display font-bold text-xl text-white">
              Grades &amp; Final Exam Calculator
            </h1>
          </div>
          <div className="font-mono-nums text-sm font-semibold text-indigo-300">
            Weighted Average: {weightedAvg}%
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3 font-medium">Course</th>
                <th className="py-2 px-2 font-medium">Current %</th>
                <th className="py-2 px-2 font-medium">Final Weight %</th>
                <th className="py-2 px-2 font-medium">Target Grade %</th>
                <th className="py-2 px-2 font-medium text-right">Needed on Final</th>
                <th className="py-2 pl-2 text-right font-medium">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {grades.map((g) => {
                const needed = calculateNeededFinalScore(
                  g.currentPercent,
                  g.targetPercent,
                  g.finalWeightPercent
                );
                return (
                  <tr key={g.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 pr-3 font-semibold text-white">
                      {g.courseName}
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="0.5"
                        aria-label={`Current percent for ${g.courseName}`}
                        value={g.currentPercent}
                        onChange={(e) =>
                          onUpdateGrade({
                            ...g,
                            currentPercent: Number(e.target.value) || 0,
                          })
                        }
                        className="w-20 rounded bg-[#090d16] border border-slate-700 px-2 py-1 font-mono-nums text-white"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        aria-label={`Final weight percent for ${g.courseName}`}
                        value={g.finalWeightPercent}
                        onChange={(e) =>
                          onUpdateGrade({
                            ...g,
                            finalWeightPercent: Number(e.target.value) || 1,
                          })
                        }
                        className="w-16 rounded bg-[#090d16] border border-slate-700 px-2 py-1 font-mono-nums text-white"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="0.5"
                        aria-label={`Target percent for ${g.courseName}`}
                        value={g.targetPercent}
                        onChange={(e) =>
                          onUpdateGrade({
                            ...g,
                            targetPercent: Number(e.target.value) || 0,
                          })
                        }
                        className="w-20 rounded bg-[#090d16] border border-slate-700 px-2 py-1 font-mono-nums text-white"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-nums font-bold">
                      <span
                        className={
                          needed > 100
                            ? 'text-red-400'
                            : needed >= 90
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                        }
                      >
                        {needed}%
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteGrade(g.id)}
                        aria-label={`Delete ${g.courseName}`}
                        className="p-1 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleAddCourse}
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80"
        >
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Course name"
            className="col-span-2 sm:col-span-1 rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white"
          />
          <input
            type="number"
            value={currentPercent}
            onChange={(e) => setCurrentPercent(e.target.value)}
            placeholder="Current %"
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white font-mono-nums"
          />
          <input
            type="number"
            value={finalWeight}
            onChange={(e) => setFinalWeight(e.target.value)}
            placeholder="Final %"
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white font-mono-nums"
          />
          <input
            type="number"
            value={targetPercent}
            onChange={(e) => setTargetPercent(e.target.value)}
            placeholder="Target %"
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white font-mono-nums"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Course</span>
          </button>
        </form>
      </section>

      {/* Class Links & Google Drive Files Organizer */}
      <section className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.45)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Class Links &amp; Drive Files Organizer
            </h2>
            <p className="text-xs text-slate-400">
              Direct shortcuts to your Canvas modules, Google Drive folders, and study tools
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://canvas.instructure.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/35 text-blue-200 border border-blue-500/35"
            >
              <span>Canvas LMS</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/35"
            >
              <span>Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <span>Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {classLinks.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-[#0b1120] border border-slate-800 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs text-blue-300 truncate">
                  {item.className} · {item.category}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white hover:text-blue-300 flex items-center gap-1.5 truncate mt-0.5"
                >
                  <span className="truncate">{item.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                </a>
              </div>
              <button
                type="button"
                onClick={() => onDeleteLink(item.id)}
                aria-label={`Remove ${item.label}`}
                className="p-1.5 rounded text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAddClassLink}
          className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-800/80"
        >
          <input
            type="text"
            value={linkClass}
            onChange={(e) => setLinkClass(e.target.value)}
            placeholder="Class (e.g. AP Chem)"
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white"
          />
          <input
            type="text"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Folder / Resource Name"
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white"
          />
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white"
          />
          <select
            value={linkCat}
            onChange={(e) => setLinkCat(e.target.value as ClassLinkItem['category'])}
            className="rounded-lg bg-[#090d16] border border-slate-700 px-3 py-1.5 text-xs text-white"
          >
            <option value="Google Drive">Google Drive</option>
            <option value="Canvas">Canvas</option>
            <option value="Resource">Resource</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Save Link</span>
          </button>
        </form>
      </section>
    </div>
  );
};
