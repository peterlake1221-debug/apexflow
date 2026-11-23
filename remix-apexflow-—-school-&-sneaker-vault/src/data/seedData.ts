import { PersistedAppState, RealMadridMatchInfo } from '../types/app';
import { createInitialStudyCity } from '../utils/cityAndQuests';
import { PRESET_SNEAKER_IMAGES } from '../utils/sneakerMath';

function hoursFromNowIso(hours: number): string {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

function daysOffsetDate(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_REAL_MADRID_MATCH: RealMadridMatchInfo = {
  statusLabel: 'Final · Matchday Telemetry',
  competition: 'La Liga EA Sports',
  homeTeam: 'Real Madrid',
  awayTeam: 'Leganés',
  homeScore: 3,
  awayScore: 0,
  matchDateLabel: 'Recent Result',
  isLive: false,
  source: 'cached',
};

export const SAMPLE_CANVAS_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Canvas LMS//NONSGML v1.0//EN
BEGIN:VEVENT
UID:canvas-sample-calc-101
DTSTART:${new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Unit 4 Derivatives Quiz [AP Calculus AB]
DESCRIPTION:Covers chain rule, implicit differentiation, and related rates.
END:VEVENT
BEGIN:VEVENT
UID:canvas-sample-bio-202
DTSTART:${new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Cellular Respiration Lab Report [AP Biology]
DESCRIPTION:Submit lab tables, ATP yield calculations, and conclusion.
END:VEVENT
BEGIN:VEVENT
UID:canvas-sample-hist-303
DTSTART:${new Date(Date.now() + 54 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Industrial Revolution DBQ Essay [US History]
DESCRIPTION:Use at least 5 primary source documents in your thesis argument.
END:VEVENT
END:VCALENDAR`;

export const INITIAL_APP_STATE: PersistedAppState = {
  version: 2,
  tasks: [
    {
      id: 'task-1',
      className: 'AP Calculus AB',
      title: 'Math Quiz: Chain Rule & Related Rates',
      dueDate: hoursFromNowIso(4),
      priority: 'High',
      status: 'In Progress',
      source: 'canvas-ics',
      icsUid: 'seed-calc-quiz',
      notes: 'Review derivative of trig functions and implicit differentiation.',
    },
    {
      id: 'task-2',
      className: 'AP Biology',
      title: 'Cellular Respiration Lab Write-Up',
      dueDate: hoursFromNowIso(26),
      priority: 'High',
      status: 'To Do',
      source: 'canvas-ics',
      icsUid: 'seed-bio-lab',
      notes: 'Include glycolysis, Krebs cycle, and oxidative phosphorylation ATP totals.',
    },
    {
      id: 'task-3',
      className: 'US History',
      title: 'Gilded Age Primary Source DBQ Outline',
      dueDate: hoursFromNowIso(52),
      priority: 'Medium',
      status: 'To Do',
      source: 'canvas-ics',
      icsUid: 'seed-hist-dbq',
    },
    {
      id: 'task-4',
      className: 'English Lit',
      title: 'Annotated Bibliography Draft',
      dueDate: hoursFromNowIso(-28),
      priority: 'High',
      status: 'To Do',
      source: 'manual',
      notes: 'Overdue! Submit on Canvas before fifth period.',
    },
    {
      id: 'task-5',
      className: 'Chemistry',
      title: 'Stoichiometry Problem Set #6',
      dueDate: hoursFromNowIso(-40),
      priority: 'Low',
      status: 'Done',
      source: 'manual',
    },
  ],
  calendarEvents: [
    {
      id: 'cal-seed-1',
      uid: 'seed-calc-quiz',
      title: 'Math Quiz: Chain Rule & Related Rates',
      className: 'AP Calculus AB',
      startDate: hoursFromNowIso(4),
      source: 'canvas-ics',
    },
    {
      id: 'cal-seed-2',
      uid: 'seed-bio-lab',
      title: 'Cellular Respiration Lab Write-Up',
      className: 'AP Biology',
      startDate: hoursFromNowIso(26),
      source: 'canvas-ics',
    },
    {
      id: 'cal-seed-3',
      uid: 'seed-hist-dbq',
      title: 'Gilded Age Primary Source DBQ Outline',
      className: 'US History',
      startDate: hoursFromNowIso(52),
      source: 'canvas-ics',
    },
  ],
  studyTitle: 'AP Biology — Cellular Respiration & ATP Yield',
  studyNotes: `Cellular respiration converts glucose and oxygen into usable ATP energy across three main stages:
1. Glycolysis (Cytoplasm): Splits 1 glucose (6C) into 2 pyruvate (3C). Net gain: 2 ATP and 2 NADH. Occurs anaerobically (no O2 required).
2. Krebs / Citric Acid Cycle (Mitochondrial Matrix): Pyruvate is oxidized into Acetyl-CoA, producing CO2, 2 ATP (GTP), 6 NADH, and 2 FADH2 per glucose.
3. Oxidative Phosphorylation / Electron Transport Chain (Inner Mitochondrial Membrane): NADH and FADH2 donate electrons to pump H+ ions across the cristae, driving ATP synthase to yield ~28–32 ATP. Oxygen acts as the final electron acceptor, forming water (H2O).
Total theoretical ATP per glucose: ~30–32 ATP.`,
  studySet: {
    sourceTitle: 'AP Biology — Cellular Respiration & ATP Yield',
    generatedAt: new Date().toISOString(),
    smartStudy: [
      {
        id: 'ss-1',
        question: 'Where does glycolysis occur, and what is its net ATP yield per glucose molecule?',
        hint: 'Think outside the mitochondria.',
        answer: 'In the cytoplasm; net yield is 2 ATP and 2 NADH.',
        explanation: 'Glycolysis invests 2 ATP and generates 4 ATP, leaving a net gain of 2 ATP without requiring oxygen.',
        topic: 'Glycolysis',
        status: 'still-learning',
      },
      {
        id: 'ss-2',
        question: 'What molecule serves as the final electron acceptor at the end of the Electron Transport Chain?',
        hint: 'It combines with H+ ions to form H2O.',
        answer: 'Oxygen (O2).',
        explanation: 'Without oxygen, electrons back up along the ETC and cells must revert to anaerobic fermentation.',
        topic: 'Oxidative Phosphorylation',
        status: 'still-learning',
      },
      {
        id: 'ss-3',
        question: 'Which enzyme uses the proton (H+) gradient across the inner mitochondrial membrane to synthesize ATP?',
        hint: 'Its name literally describes what it builds.',
        answer: 'ATP synthase.',
        explanation: 'Chemiosmosis drives H+ ions through ATP synthase, powering phosphorylation of ADP to ATP.',
        topic: 'Chemiosmosis',
        status: 'mastered',
      },
    ],
    studyGuide: {
      title: 'Cellular Respiration & Energy Conversion',
      overview:
        'Aerobic cellular respiration harvests energy from glucose in three sequential stages, yielding roughly 30–32 ATP per glucose molecule.',
      keyPoints: [
        'Glycolysis takes place in the cytoplasm and produces 2 pyruvate, 2 net ATP, and 2 NADH.',
        'Pyruvate oxidation converts pyruvate into Acetyl-CoA inside the mitochondrial matrix, releasing CO2.',
        'The Krebs Cycle generates NADH and FADH2 electron carriers alongside 2 ATP per glucose.',
        'The Electron Transport Chain & chemiosmosis generate the majority of ATP (~28 ATP) using O2 as final electron acceptor.',
      ],
      vocabulary: [
        { term: 'Glycolysis', definition: 'Anaerobic breakdown of one 6-carbon glucose into two 3-carbon pyruvate molecules.' },
        { term: 'NADH / FADH2', definition: 'High-energy electron carrier coenzymes that shuttle electrons to the ETC.' },
        { term: 'Chemiosmosis', definition: 'Movement of H+ ions down their electrochemical gradient through ATP synthase.' },
        { term: 'Cristae', definition: 'Folds of the inner mitochondrial membrane that increase surface area for ATP production.' },
      ],
    },
    flashcards: [
      {
        id: 'fc-1',
        front: 'Glycolysis Location & Net Yield',
        back: 'Cytoplasm · 2 Pyruvate, 2 net ATP, 2 NADH (anaerobic)',
        status: 'still-learning',
      },
      {
        id: 'fc-2',
        front: 'Final Electron Acceptor in ETC',
        back: 'Oxygen (O2) — combines with electrons and H+ to produce water (H2O)',
        status: 'still-learning',
      },
      {
        id: 'fc-3',
        front: 'Krebs Cycle Location',
        back: 'Mitochondrial matrix · produces CO2, 2 ATP, 6 NADH, 2 FADH2',
        status: 'mastered',
      },
      {
        id: 'fc-4',
        front: 'ATP Synthase Fuel Source',
        back: 'Proton (H+) electrochemical gradient across the inner mitochondrial membrane',
        status: 'still-learning',
      },
    ],
    practiceTest: [
      {
        id: 'pt-1',
        type: 'multiple-choice',
        prompt: 'Which stage of cellular respiration produces the largest share of ATP?',
        options: ['Glycolysis', 'Pyruvate Oxidation', 'Krebs Cycle', 'Oxidative Phosphorylation (ETC)'],
        correctAnswer: 'Oxidative Phosphorylation (ETC)',
        explanation: 'The ETC + chemiosmosis produces ~26–28 of the ~30–32 total ATP per glucose.',
      },
      {
        id: 'pt-2',
        type: 'multiple-choice',
        prompt: 'Where in the cell do the reactions of the Krebs (Citric Acid) Cycle occur?',
        options: ['Cytoplasm', 'Mitochondrial Matrix', 'Nucleolus', 'Outer Cell Membrane'],
        correctAnswer: 'Mitochondrial Matrix',
        explanation: 'Pyruvate enters the mitochondrial matrix where Acetyl-CoA enters the Krebs cycle.',
      },
      {
        id: 'pt-3',
        type: 'fill-blank',
        prompt: 'Glycolysis breaks down one glucose molecule into two molecules of ________.',
        correctAnswer: 'pyruvate',
        explanation: 'One 6-carbon glucose splits into two 3-carbon pyruvate molecules.',
      },
    ],
  },
  grades: [
    { id: 'g-1', courseName: 'AP Calculus AB', credits: 1, currentPercent: 88.5, finalWeightPercent: 20, targetPercent: 90 },
    { id: 'g-2', courseName: 'AP Biology', credits: 1, currentPercent: 92.0, finalWeightPercent: 15, targetPercent: 93 },
    { id: 'g-3', courseName: 'US History', credits: 1, currentPercent: 85.0, finalWeightPercent: 20, targetPercent: 88 },
    { id: 'g-4', courseName: 'English Literature', credits: 1, currentPercent: 90.5, finalWeightPercent: 15, targetPercent: 92 },
  ],
  classLinks: [
    { id: 'cl-1', className: 'AP Calculus AB', label: 'Canvas Course Module', url: 'https://canvas.instructure.com', category: 'Canvas' },
    { id: 'cl-2', className: 'AP Biology', label: 'Lab Reports Drive Folder', url: 'https://drive.google.com', category: 'Google Drive' },
    { id: 'cl-3', className: 'US History', label: 'Primary Sources Archive', url: 'https://drive.google.com', category: 'Google Drive' },
    { id: 'cl-4', className: 'All Classes', label: 'Desmos Graphing Calculator', url: 'https://www.desmos.com/calculator', category: 'Resource' },
  ],
  sneakers: [
    {
      id: 'snk-1',
      modelName: 'Adidas Samba OG Cloud White / Core Black',
      modelFamily: 'Samba',
      category: "Men's",
      size: '10',
      condition: 'DS',
      status: 'In Hand',
      buyPrice: 78,
      feePercent: 8,
      purchaseDate: daysOffsetDate(-18),
      sourceNote: 'Adidas Confirmed Drop',
      imageUrl: PRESET_SNEAKER_IMAGES.Samba,
    },
    {
      id: 'snk-2',
      modelName: 'Air Jordan 1 Retro High OG Chicago',
      modelFamily: 'Jordan 1',
      category: "Men's",
      size: '10.5',
      condition: 'DS',
      status: 'In Hand',
      buyPrice: 180,
      feePercent: 8,
      purchaseDate: daysOffsetDate(-34),
      sourceNote: 'SNKRS Exclusive Access',
      imageUrl: PRESET_SNEAKER_IMAGES['Jordan 1'],
    },
    {
      id: 'snk-3',
      modelName: 'Adidas Handball Spezial Collegiate Navy',
      modelFamily: 'Spezial',
      category: "Women's",
      size: '8.5',
      condition: 'VNDS',
      status: 'In Hand',
      buyPrice: 72,
      feePercent: 0,
      purchaseDate: daysOffsetDate(-9),
      sourceNote: 'Local Outlet Pickup',
      imageUrl: PRESET_SNEAKER_IMAGES.Spezial,
    },
    {
      id: 'snk-4',
      modelName: 'Nike Dunk Low Panda Black / White',
      modelFamily: 'Dunk',
      category: "Men's",
      size: '9.5',
      condition: 'DS',
      status: 'Sold',
      buyPrice: 95,
      feePercent: 8,
      soldPrice: 155,
      purchaseDate: daysOffsetDate(-24),
      soldDate: daysOffsetDate(-11),
      sourceNote: 'Foot Locker Restock',
      imageUrl: PRESET_SNEAKER_IMAGES.Dunk,
    },
    {
      id: 'snk-5',
      modelName: 'Air Jordan 4 Retro Bred Reimagined',
      modelFamily: 'Jordan 4',
      category: "Men's",
      size: '11',
      condition: 'Damaged Box',
      status: 'Loss',
      buyPrice: 215,
      feePercent: 8,
      soldPrice: 190,
      purchaseDate: daysOffsetDate(-41),
      soldDate: daysOffsetDate(-14),
      sourceNote: 'Local Trade-In (box crease)',
      imageUrl: PRESET_SNEAKER_IMAGES['Jordan 4'],
    },
    {
      id: 'snk-6',
      modelName: 'Nike Dunk Low Grey Fog',
      modelFamily: 'Dunk',
      category: "Men's",
      size: '10',
      condition: 'DS',
      status: 'Returned',
      buyPrice: 115,
      feePercent: 0,
      purchaseDate: daysOffsetDate(-22),
      returnDeadline: daysOffsetDate(2),
      sourceNote: 'Nike Store Return Drop-off',
      imageUrl: PRESET_SNEAKER_IMAGES.Dunk,
    },
  ],
  studyStats: {
    streakDays: 2,
    xp: 120,
    lastActivityDate: daysOffsetDate(-1),
    completedPomodoros: 2,
    completedQuizzes: 1,
  },
  studyCity: createInitialStudyCity(120, 2),
  upgradeIdeas: [],
  appliedDevPatches: [],
  settings: {
    canvasIcsUrl: '',
    googleCalendarUrl: 'https://calendar.google.com/calendar/u/0/r',
    motionPaused: false,
    lastBackupAt: null,
    vaultPin: '1234',
    monthlyProfitGoal: 500,
    startingBankroll: 2500,
    studyThemeColor: '#04070f',
    soleThemeColor: 'black',
    studioAnnouncement: '',
  },
};
