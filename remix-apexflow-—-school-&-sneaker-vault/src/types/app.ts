export type AuthStage = 'locked' | 'workspace';
export type AppMode = 'school' | 'inventory' | 'dev';
export type LockUserId = 'study' | 'sole' | 'dev';

export type SchoolTab = 'overview' | 'city' | 'study' | 'calendar' | 'grades';
export type InventoryTab = 'all' | 'in-hand' | 'sold' | 'returned' | 'losses';

export type SoleThemeColor = 'black' | 'white' | 'red' | 'green' | 'blue' | 'yellow';
export type DevAiMode = 'web-flash' | 'study-up' | 'sole-up' | 'deep-ai';
export type FocusAudioTrack = 'off' | 'rain' | 'lofi' | 'white-noise';
export type CityLevel = 1 | 2 | 3 | 4 | 5;
export type CityLandmarkId =
  | 'cabin'
  | 'cafe'
  | 'library'
  | 'sneaker-store'
  | 'stadium'
  | 'trophy-monument';

export interface StudyCityState {
  bricks: number;
  blueprints: number;
  level: CityLevel;
  totalStudyMinutes: number;
  unlockedLandmarks: CityLandmarkId[];
  championshipTrophyUnlocked: boolean;
  bossBattlesWon: number;
  completedFocusToday: number;
  completedUrgentTasks: number;
  highScoreQuizzes: number;
  lastQuestDate: string; // YYYY-MM-DD local date
  lastQuestWeek: string; // YYYY-Www ISO week key
  claimedQuests: Record<string, string>; // questId -> periodKey
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface AssignmentTask {
  id: string;
  className: string;
  title: string;
  dueDate: string; // ISO date-time string
  priority: PriorityLevel;
  status: TaskStatus;
  source?: 'manual' | 'canvas-ics';
  icsUid?: string;
  notes?: string;
}

export interface CalendarEventItem {
  id: string;
  uid: string;
  title: string;
  className: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  source: 'canvas-ics' | 'manual';
}

export type StudyModeType = 'smart-study' | 'study-guide' | 'flashcards' | 'test';

export interface SmartStudyQuestion {
  id: string;
  question: string;
  hint: string;
  answer: string;
  explanation: string;
  topic: string;
  status: 'still-learning' | 'mastered';
}

export interface StudyGuideData {
  title: string;
  overview: string;
  keyPoints: string[];
  vocabulary: Array<{
    term: string;
    definition: string;
  }>;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  status: 'still-learning' | 'mastered';
}

export interface PracticeTestQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedStudySet {
  sourceTitle: string;
  generatedAt: string;
  smartStudy: SmartStudyQuestion[];
  studyGuide: StudyGuideData | null;
  flashcards: FlashcardItem[];
  practiceTest: PracticeTestQuestion[];
}

export interface CourseGrade {
  id: string;
  courseName: string;
  credits: number;
  currentPercent: number;
  finalWeightPercent: number;
  targetPercent: number;
}

export interface ClassLinkItem {
  id: string;
  className: string;
  label: string;
  url: string;
  category: 'Canvas' | 'Google Drive' | 'Resource';
}

export type SneakerCategory = "Men's" | "Women's";
export type SneakerCondition =
  | 'Deadstock / OG All'
  | 'VNDS / Tried On'
  | 'No Box Lid'
  | 'Used'
  | 'DS'
  | 'VNDS'
  | 'No Lid'
  | 'Damaged Box';
export type SneakerStatus = 'In Hand' | 'Sold' | 'Returned' | 'Loss';
export type ModelFamily = 'Samba' | 'Spezial' | 'Dunk' | 'Jordan 1' | 'Jordan 4' | 'Other';
export type SneakerBrand = 'Adidas' | 'Nike' | 'Jordan' | 'New Balance' | 'Sneaker';

export interface SneakerPair {
  id: string;
  modelName: string;
  modelFamily: ModelFamily;
  category: SneakerCategory;
  size: string;
  condition: SneakerCondition;
  status: SneakerStatus;
  buyPrice: number;
  feePercent: number;
  soldPrice?: number;
  purchaseDate: string; // YYYY-MM-DD
  soldDate?: string; // YYYY-MM-DD
  returnDeadline?: string; // YYYY-MM-DD
  sourceNote: string;
  imageUrl?: string;
  sku?: string;
  receiptUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface UpgradeIdeaItem {
  id: string;
  text: string;
  target: 'General' | 'Study' | 'Sole' | 'Dev';
  createdAt: string;
}

export interface AppliedDevPatch {
  id: string;
  title: string;
  aiMode: DevAiMode;
  targetArea: string;
  appliedAt: string;
}

export interface RealMadridMatchInfo {
  statusLabel: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDateLabel: string;
  isLive: boolean;
  source: 'live-api' | 'cached';
}

export interface StudyProgressStats {
  streakDays: number;
  xp: number;
  lastActivityDate: string | null; // YYYY-MM-DD local date
  completedPomodoros: number;
  completedQuizzes: number;
}

export interface AppSettings {
  canvasIcsUrl: string;
  googleCalendarUrl: string;
  motionPaused: boolean;
  lastBackupAt: string | null;
  vaultPin: string;
  monthlyProfitGoal: number;
  startingBankroll: number;
  studyThemeColor: string; // hex color e.g. '#04070f', '#f8fafc', '#4f46e5', etc.
  soleThemeColor: SoleThemeColor;
  studioAnnouncement: string;
}

export interface PersistedAppState {
  version: number;
  tasks: AssignmentTask[];
  calendarEvents: CalendarEventItem[];
  studyNotes: string;
  studyTitle: string;
  studySet: GeneratedStudySet | null;
  grades: CourseGrade[];
  classLinks: ClassLinkItem[];
  sneakers: SneakerPair[];
  studyStats: StudyProgressStats;
  studyCity: StudyCityState;
  upgradeIdeas: UpgradeIdeaItem[];
  appliedDevPatches: AppliedDevPatch[];
  settings: AppSettings;
}
