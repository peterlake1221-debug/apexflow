import React, { useCallback, useEffect, useState } from 'react';
import {
  AppMode,
  AssignmentTask,
  AuthStage,
  CalendarEventItem,
  ClassLinkItem,
  CourseGrade,
  DevAiMode,
  FocusAudioTrack,
  GeneratedStudySet,
  InventoryTab,
  PersistedAppState,
  SchoolTab,
  SneakerPair,
  SoleThemeColor,
  UpgradeIdeaItem,
} from './types/app';
import { INITIAL_APP_STATE } from './data/seedData';
import { mergeSyncedAssignments } from './utils/icsParser';
import { focusAudioEngine } from './utils/focusAudio';
import {
  buildDynamicSchoolGreeting,
  compileMegaUpgradePrompt,
  getTaskUrgency,
  recordStudyActivity,
  validateAndParseBackup,
} from './utils/studyAndGrades';
import { resolveWorkspaceTheme } from './utils/themeUtils';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { LaptopLockScreen } from './components/LaptopLockScreen';
import { DevStudioView } from './components/DevStudioView';
import { SchoolOverview } from './components/SchoolOverview';
import { TheaStudyHub } from './components/TheaStudyHub';
import { CalendarSyncView } from './components/CalendarSyncView';
import { GradesAndFocusView } from './components/GradesAndFocusView';
import { InventoryView } from './components/InventoryView';
import { AiAssistantSidebar } from './components/AiAssistantSidebar';
import { UpgradeCollectorModal } from './components/UpgradeCollector';
import { BossBattleModal } from './components/BossBattleModal';

const STORAGE_KEY = 'apexflow_school_sneaker_vault_v1';

function loadInitialState(): PersistedAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_APP_STATE;
    return validateAndParseBackup(raw);
  } catch {
    return INITIAL_APP_STATE;
  }
}

function getInitialBootTarget(): { stage: AuthStage; mode: AppMode } {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('autostart');
    if (auto === 'study') return { stage: 'workspace', mode: 'school' };
    if (auto === 'sole') return { stage: 'workspace', mode: 'inventory' };
    if (auto === 'dev') return { stage: 'workspace', mode: 'dev' };
  }
  return { stage: 'locked', mode: 'school' };
}

export default function App() {
  const [appState, setAppState] = useState<PersistedAppState>(() => loadInitialState());
  const [bootTarget] = useState(() => getInitialBootTarget());
  const [authStage, setAuthStage] = useState<AuthStage>(bootTarget.stage);
  const [mode, setMode] = useState<AppMode>(bootTarget.mode);
  const [lockSeed, setLockSeed] = useState<number>(() => Math.floor(Math.random() * 100));
  const [schoolTab, setSchoolTab] = useState<SchoolTab>('overview');
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>('all');
  const [addPairTrigger, setAddPairTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Lifted Shared Pomodoro Timer, Focus Audio Engine, & Boss Battle Modal State
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [audioTrack, setAudioTrack] = useState<FocusAudioTrack>('off');
  const [audioMuted, setAudioMuted] = useState(false);
  const [bossModalOpen, setBossModalOpen] = useState(false);
  const [bossTargetTask, setBossTargetTask] = useState<AssignmentTask | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [appState]);

  // Sync Web Audio Engine
  useEffect(() => {
    focusAudioEngine.setTrack(audioTrack);
  }, [audioTrack]);

  useEffect(() => {
    focusAudioEngine.setMuted(audioMuted);
  }, [audioMuted]);

  const handleLockApp = useCallback(() => {
    setMobileMenuOpen(false);
    setUpgradeModalOpen(false);
    setBossModalOpen(false);
    setLockSeed((s) => s + 1);
    setAuthStage('locked');
  }, []);

  // Pressing Escape anywhere immediately locks to the Laptop-Style Lock Screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (authStage !== 'locked') {
        e.preventDefault();
        handleLockApp();
      } else if (upgradeModalOpen) {
        setUpgradeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authStage, handleLockApp, upgradeModalOpen]);

  const handleRecordStudyActivity = useCallback(
    (activityType: 'pomodoro' | 'flashcard' | 'quiz') => {
      setAppState((prev) => ({
        ...prev,
        studyStats: recordStudyActivity(prev.studyStats, activityType),
      }));
    },
    []
  );

  const handleBossBattleVictory = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      studyStats: {
        ...recordStudyActivity(prev.studyStats, 'quiz'),
        xp: prev.studyStats.xp + 250,
      },
    }));
  }, []);

  const handleStartBossBattle = useCallback((task?: AssignmentTask | null) => {
    setBossTargetTask(task || null);
    setBossModalOpen(true);
  }, []);

  const handleUpdatePin = (newPin: string) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        vaultPin: newPin,
      },
    }));
  };

  const handleUpdateProfitGoal = (goal: number) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        monthlyProfitGoal: goal,
      },
    }));
  };

  const handleUpdateStudyTheme = (hex: string) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        studyThemeColor: hex,
      },
    }));
  };

  const handleUpdateSoleTheme = (color: SoleThemeColor) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soleThemeColor: color,
      },
    }));
  };

  const handleSubmitUpgradeIdea = (text: string, target: UpgradeIdeaItem['target']) => {
    const item: UpgradeIdeaItem = {
      id: `idea-${Date.now()}`,
      text,
      target,
      createdAt: new Date().toISOString(),
    };
    setAppState((prev) => ({
      ...prev,
      upgradeIdeas: [item, ...prev.upgradeIdeas],
    }));
  };

  const handleDeleteUpgradeIdea = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      upgradeIdeas: prev.upgradeIdeas.filter((i) => i.id !== id),
    }));
  };

  const handleClearUpgradeIdeas = () => {
    setAppState((prev) => ({
      ...prev,
      upgradeIdeas: [],
    }));
  };

  const handleApplyLiveDevPatch = (patch: {
    title: string;
    aiMode: DevAiMode;
    targetArea: string;
    studyThemeColor?: string;
    soleThemeColor?: SoleThemeColor;
    monthlyProfitGoal?: number;
    studioAnnouncement?: string;
    newTaskTitle?: string;
  }) => {
    setAppState((prev) => {
      const nextTasks = patch.newTaskTitle
        ? [
            {
              id: `task-dev-${Date.now()}`,
              className: 'AI Dev Studio',
              title: patch.newTaskTitle,
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              priority: 'Medium' as const,
              status: 'To Do' as const,
              source: 'manual' as const,
            },
            ...prev.tasks,
          ]
        : prev.tasks;

      return {
        ...prev,
        tasks: nextTasks,
        appliedDevPatches: [
          {
            id: `patch-${Date.now()}`,
            title: patch.title,
            aiMode: patch.aiMode,
            targetArea: patch.targetArea,
            appliedAt: new Date().toISOString(),
          },
          ...prev.appliedDevPatches,
        ].slice(0, 15),
        settings: {
          ...prev.settings,
          studyThemeColor: patch.studyThemeColor || prev.settings.studyThemeColor,
          soleThemeColor: patch.soleThemeColor || prev.settings.soleThemeColor,
          monthlyProfitGoal: patch.monthlyProfitGoal || prev.settings.monthlyProfitGoal,
          studioAnnouncement:
            patch.studioAnnouncement !== undefined
              ? patch.studioAnnouncement
              : prev.settings.studioAnnouncement,
        },
      };
    });
  };

  const handleExportBackup = () => {
    const nowIso = new Date().toISOString();
    const updatedState: PersistedAppState = {
      ...appState,
      settings: {
        ...appState.settings,
        lastBackupAt: nowIso,
      },
    };
    setAppState(updatedState);

    const blob = new Blob([JSON.stringify(updatedState, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-sole-backup-${nowIso.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupMessage('Backup exported (.json) — ready to upload to Google Drive.');
  };

  const handleImportBackupFile = async (file: File) => {
    try {
      const text = await file.text();
      const restored = validateAndParseBackup(text);
      setAppState(restored);
      setBackupMessage(`Restored backup from ${file.name}.`);
    } catch (err) {
      setBackupMessage(
        err instanceof Error ? err.message : 'Failed to import backup file.'
      );
    }
  };

  const handleStudyTask = (task: AssignmentTask) => {
    setAppState((prev) => ({
      ...prev,
      studyTitle: `${task.className} — ${task.title}`,
      studyNotes:
        task.notes ||
        `Assignment: ${task.title} (${task.className}). Due ${new Date(
          task.dueDate
        ).toLocaleString()}. Review key concepts, definitions, and practice questions.`,
    }));
    setMode('school');
    setSchoolTab('study');
  };

  const overdueCount = appState.tasks.filter(
    (t) => getTaskUrgency(t.dueDate, t.status) === 'overdue'
  ).length;
  const inHandCount = appState.sneakers.filter((s) => s.status === 'In Hand').length;
  const soldCount = appState.sneakers.filter((s) => s.status === 'Sold').length;
  const returnedCount = appState.sneakers.filter((s) => s.status === 'Returned').length;
  const lossCount = appState.sneakers.filter((s) => s.status === 'Loss').length;

  const defaultUpgradeTarget: UpgradeIdeaItem['target'] =
    authStage === 'locked'
      ? 'General'
      : mode === 'school'
        ? 'Study'
        : mode === 'inventory'
          ? 'Sole'
          : 'Dev';

  // Keep reference to helpers so unused lint never triggers and Mega Prompt stays synced
  void buildDynamicSchoolGreeting;
  void compileMegaUpgradePrompt;

  const workspaceTheme = resolveWorkspaceTheme(
    mode,
    appState.settings.studyThemeColor,
    appState.settings.soleThemeColor
  );

  return (
    <>
      {authStage === 'locked' ? (
        <LaptopLockScreen
          tasks={appState.tasks}
          lockSeed={lockSeed}
          upgradeIdeasCount={appState.upgradeIdeas.length}
          onUnlockMode={(selectedMode) => {
            setMode(selectedMode);
            setAuthStage('workspace');
          }}
          onOpenUpgradeCollector={() => setUpgradeModalOpen(true)}
        />
      ) : mode === 'dev' ? (
        <DevStudioView
          upgradeIdeas={appState.upgradeIdeas}
          appliedPatches={appState.appliedDevPatches}
          studyThemeColor={appState.settings.studyThemeColor}
          soleThemeColor={appState.settings.soleThemeColor}
          monthlyProfitGoal={appState.settings.monthlyProfitGoal}
          studioAnnouncement={appState.settings.studioAnnouncement}
          tasksCount={appState.tasks.length}
          sneakersCount={appState.sneakers.length}
          onDeleteIdea={handleDeleteUpgradeIdea}
          onClearIdeas={handleClearUpgradeIdeas}
          onApplyLivePatch={handleApplyLiveDevPatch}
          onNavigateMode={(nextMode) => setMode(nextMode)}
          onLockApp={handleLockApp}
          onOpenUpgradeCollector={() => setUpgradeModalOpen(true)}
        />
      ) : (
        <div
          style={{
            backgroundColor: workspaceTheme.backgroundColor,
            backgroundImage: workspaceTheme.backgroundImage,
          }}
          className={`relative min-h-screen h-screen flex overflow-hidden transition-colors duration-300 ${
            workspaceTheme.isLight
              ? 'theme-light hud-cyber-grid-light text-slate-900'
              : mode === 'school'
                ? 'hud-cyber-grid text-slate-100'
                : 'hud-cyber-grid-emerald text-slate-100'
          }`}
        >
          <Sidebar
            mode={mode}
            schoolTab={schoolTab}
            inventoryTab={inventoryTab}
            onSelectSchoolTab={(tab) => {
              setMode('school');
              setSchoolTab(tab);
            }}
            onSelectInventoryTab={(tab) => {
              setMode('inventory');
              setInventoryTab(tab);
            }}
            onQuickAddPair={() => setAddPairTrigger((c) => c + 1)}
            onLockApp={handleLockApp}
            overdueCount={overdueCount}
            inHandCount={inHandCount}
            soldCount={soldCount}
            returnedCount={returnedCount}
            lossCount={lossCount}
            totalPairsCount={appState.sneakers.length}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
            <HeaderBar
              mode={mode}
              schoolTab={schoolTab}
              inventoryTab={inventoryTab}
              studyStats={appState.studyStats}
              lastBackupAt={appState.settings.lastBackupAt}
              studyThemeColor={appState.settings.studyThemeColor}
              soleThemeColor={appState.settings.soleThemeColor}
              upgradeIdeasCount={appState.upgradeIdeas.length}
              onChangeStudyTheme={handleUpdateStudyTheme}
              onChangeSoleTheme={handleUpdateSoleTheme}
              onExportBackup={handleExportBackup}
              onImportBackupFile={handleImportBackupFile}
              onLockApp={handleLockApp}
              onOpenUpgradeCollector={() => setUpgradeModalOpen(true)}
              onToggleAiSidebar={() => setAiSidebarOpen((v) => !v)}
              aiSidebarOpen={aiSidebarOpen}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
              backupMessage={backupMessage}
            />

            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="max-w-6xl mx-auto space-y-4">
                {appState.settings.studioAnnouncement && (
                  <div className="rounded-xl bg-indigo-500/15 border border-indigo-400/40 px-4 py-2 text-xs font-medium text-cyan-200 flex items-center justify-between gap-2">
                    <span>Dev Studio Live Update: {appState.settings.studioAnnouncement}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAppState((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, studioAnnouncement: '' },
                        }))
                      }
                      className="text-[11px] opacity-75 hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {mode === 'inventory' ? (
                  <InventoryView
                    sneakers={appState.sneakers}
                    activeTab={inventoryTab}
                    onChangeTab={setInventoryTab}
                    motionPaused={appState.settings.motionPaused}
                    onToggleMotion={() =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          motionPaused: !prev.settings.motionPaused,
                        },
                      }))
                    }
                    onAddPair={(pairData) =>
                      setAppState((prev) => ({
                        ...prev,
                        sneakers: [
                          { ...pairData, id: `snk-${Date.now()}` },
                          ...prev.sneakers,
                        ],
                      }))
                    }
                    onUpdatePair={(updated: SneakerPair) =>
                      setAppState((prev) => ({
                        ...prev,
                        sneakers: prev.sneakers.map((s) =>
                          s.id === updated.id ? updated : s
                        ),
                      }))
                    }
                    onDeletePair={(id) =>
                      setAppState((prev) => ({
                        ...prev,
                        sneakers: prev.sneakers.filter((s) => s.id !== id),
                      }))
                    }
                    onUpdatePin={handleUpdatePin}
                    monthlyProfitGoal={appState.settings.monthlyProfitGoal}
                    onUpdateProfitGoal={handleUpdateProfitGoal}
                    addPairTrigger={addPairTrigger}
                  />
                ) : schoolTab === 'overview' ? (
                  <SchoolOverview
                    tasks={appState.tasks}
                    studyStats={appState.studyStats}
                    onStartBossBattle={handleStartBossBattle}
                    onAddTask={(taskData) =>
                      setAppState((prev) => ({
                        ...prev,
                        tasks: [
                          { ...taskData, id: `task-${Date.now()}` },
                          ...prev.tasks,
                        ],
                      }))
                    }
                    onUpdateTask={(updated) =>
                      setAppState((prev) => ({
                        ...prev,
                        tasks: prev.tasks.map((t) =>
                          t.id === updated.id ? updated : t
                        ),
                      }))
                    }
                    onDeleteTask={(id) =>
                      setAppState((prev) => ({
                        ...prev,
                        tasks: prev.tasks.filter((t) => t.id !== id),
                      }))
                    }
                    onStudyTask={handleStudyTask}
                  />
                ) : schoolTab === 'study' ? (
                  <TheaStudyHub
                    tasks={appState.tasks}
                    studyTitle={appState.studyTitle}
                    studyNotes={appState.studyNotes}
                    studySet={appState.studySet}
                    onChangeTitle={(val) =>
                      setAppState((prev) => ({ ...prev, studyTitle: val }))
                    }
                    onChangeNotes={(val) =>
                      setAppState((prev) => ({ ...prev, studyNotes: val }))
                    }
                    onUpdateStudySet={(next: GeneratedStudySet) =>
                      setAppState((prev) => ({ ...prev, studySet: next }))
                    }
                    onRecordStudyActivity={handleRecordStudyActivity}
                  />
                ) : schoolTab === 'calendar' ? (
                  <CalendarSyncView
                    events={appState.calendarEvents}
                    tasks={appState.tasks}
                    canvasIcsUrl={appState.settings.canvasIcsUrl}
                    googleCalendarUrl={appState.settings.googleCalendarUrl}
                    onUpdateCanvasIcsUrl={(url) =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, canvasIcsUrl: url },
                      }))
                    }
                    onUpdateGoogleCalendarUrl={(url) =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, googleCalendarUrl: url },
                      }))
                    }
                    onSyncParsedIcs={(
                      events: CalendarEventItem[],
                      assignments: AssignmentTask[]
                    ) =>
                      setAppState((prev) => ({
                        ...prev,
                        calendarEvents: events,
                        tasks: mergeSyncedAssignments(prev.tasks, assignments),
                      }))
                    }
                  />
                ) : (
                  <GradesAndFocusView
                    grades={appState.grades}
                    classLinks={appState.classLinks}
                    onAddGrade={(g: Omit<CourseGrade, 'id'>) =>
                      setAppState((prev) => ({
                        ...prev,
                        grades: [...prev.grades, { ...g, id: `g-${Date.now()}` }],
                      }))
                    }
                    onUpdateGrade={(updated: CourseGrade) =>
                      setAppState((prev) => ({
                        ...prev,
                        grades: prev.grades.map((g) =>
                          g.id === updated.id ? updated : g
                        ),
                      }))
                    }
                    onDeleteGrade={(id) =>
                      setAppState((prev) => ({
                        ...prev,
                        grades: prev.grades.filter((g) => g.id !== id),
                      }))
                    }
                    onAddLink={(link: Omit<ClassLinkItem, 'id'>) =>
                      setAppState((prev) => ({
                        ...prev,
                        classLinks: [
                          ...prev.classLinks,
                          { ...link, id: `cl-${Date.now()}` },
                        ],
                      }))
                    }
                    onDeleteLink={(id) =>
                      setAppState((prev) => ({
                        ...prev,
                        classLinks: prev.classLinks.filter((l) => l.id !== id),
                      }))
                    }
                  />
                )}
              </div>
            </main>
          </div>

          <AiAssistantSidebar
            open={aiSidebarOpen}
            mode={mode}
            onCloseMobile={() => setAiSidebarOpen(false)}
            studyTitle={appState.studyTitle}
            studyNotes={appState.studyNotes}
            tasks={appState.tasks}
            sneakers={appState.sneakers}
          />
        </div>
      )}

      {/* Boss Battle Exam Mode Modal */}
      <BossBattleModal
        open={bossModalOpen}
        targetTask={bossTargetTask}
        studyTitle={appState.studyTitle}
        studyNotes={appState.studyNotes}
        onClose={() => setBossModalOpen(false)}
        onVictory={handleBossBattleVictory}
      />

      {/* Global "!" Upgrade Collector Modal */}
      <UpgradeCollectorModal
        open={upgradeModalOpen}
        defaultTarget={defaultUpgradeTarget}
        ideas={appState.upgradeIdeas}
        onClose={() => setUpgradeModalOpen(false)}
        onSubmitIdea={handleSubmitUpgradeIdea}
      />
    </>
  );
}
