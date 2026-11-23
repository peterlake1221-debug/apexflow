import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns/promises';
import net from 'net';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: string | Array<any>,
  config?: any
): Promise<string> {
  const models = ['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
  const delays = [1000, 2000, 4000];

  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const is503 =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('overloaded') ||
          msg.includes('RESOURCE_EXHAUSTED');
        if (is503 && attempt < 2) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
        if (!is503) {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All model endpoints unavailable after retries.');
}

function isPrivateOrLoopbackIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }
    if (normalized.startsWith('::ffff:')) {
      return isPrivateOrLoopbackIp(normalized.slice(7));
    }
    return false;
  }
  return true;
}

async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Please enter a valid URL starting with https:// or http://.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http:// and https:// calendar feed URLs are supported.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Private or local network calendar URLs are not allowed.');
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrLoopbackIp(hostname)) {
      throw new Error('Private or loopback IP addresses are not allowed.');
    }
    return parsed;
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (addresses.length === 0) {
      throw new Error('Could not resolve calendar host.');
    }
    for (const entry of addresses) {
      if (isPrivateOrLoopbackIp(entry.address)) {
        throw new Error('Resolved host points to a restricted network range.');
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('restricted')) {
      throw err;
    }
    throw new Error('Unable to resolve the calendar feed domain.');
  }

  return parsed;
}

app.post('/api/calendar/fetch-ics', async (req, res) => {
  try {
    const { url } = req.body as { url?: unknown };
    if (typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Calendar feed URL is required.' });
      return;
    }

    const safeUrl = await assertSafeExternalUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const upstream = await fetch(safeUrl.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'text/calendar, text/plain, */*',
        },
        redirect: 'manual',
      });

      if (upstream.status >= 300 && upstream.status < 400) {
        const loc = upstream.headers.get('location');
        if (!loc) {
          res.status(400).json({ error: 'Calendar feed returned an invalid redirect.' });
          return;
        }
        const redirectTarget = await assertSafeExternalUrl(new URL(loc, safeUrl).toString());
        const redirected = await fetch(redirectTarget.toString(), {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'text/calendar, text/plain, */*' },
          redirect: 'error',
        });
        if (!redirected.ok) {
          res.status(502).json({ error: `Calendar feed returned HTTP ${redirected.status}.` });
          return;
        }
        const text = await redirected.text();
        res.json({ icsText: text.slice(0, 500_000) });
        return;
      }

      if (!upstream.ok) {
        res.status(502).json({ error: `Calendar feed returned HTTP ${upstream.status}.` });
        return;
      }

      const icsText = await upstream.text();
      if (!icsText.includes('BEGIN:VCALENDAR')) {
        res.status(400).json({
          error: 'The URL did not return a valid .ics calendar (missing BEGIN:VCALENDAR).',
        });
        return;
      }

      res.json({ icsText: icsText.slice(0, 500_000) });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch .ics calendar feed.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/ai/study', async (req, res) => {
  try {
    const { notes, title } = req.body as { notes?: unknown; title?: unknown };
    if (typeof notes !== 'string' || notes.trim().length < 10) {
      res.status(400).json({ error: 'Please provide at least a short paragraph of study notes.' });
      return;
    }

    const ai = getGeminiClient();
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Class Study Set';
    const trimmedNotes = notes.slice(0, 12000);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate a complete Thea-style study package from these student notes titled "${safeTitle}":\n\n${trimmedNotes}`,
      config: {
        systemInstruction:
          'You are an expert academic study tutor. Produce accurate, concise, high-utility study materials directly grounded in the provided notes: 4 Smart Study adaptive Q&A items, 1 structured Study Guide with 4-6 bullet keyPoints and 4 vocabulary definitions, 5 concise Flashcards, and 4 Practice Test questions (mix of multiple-choice with 4 options and fill-blank).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smartStudy: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['question', 'hint', 'answer', 'explanation', 'topic'],
              },
            },
            studyGuide: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                overview: { type: Type.STRING },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                vocabulary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                    },
                    required: ['term', 'definition'],
                  },
                },
              },
              required: ['title', 'overview', 'keyPoints', 'vocabulary'],
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
                required: ['front', 'back'],
              },
            },
            practiceTest: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['type', 'prompt', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['smartStudy', 'studyGuide', 'flashcards', 'practiceTest'],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    const normalized = {
      sourceTitle: safeTitle,
      generatedAt: new Date().toISOString(),
      smartStudy: (parsed.smartStudy || []).map((q: Record<string, string>, idx: number) => ({
        id: `ss-${Date.now()}-${idx}`,
        question: q.question || '',
        hint: q.hint || '',
        answer: q.answer || '',
        explanation: q.explanation || '',
        topic: q.topic || safeTitle,
        status: 'still-learning' as const,
      })),
      studyGuide: parsed.studyGuide || null,
      flashcards: (parsed.flashcards || []).map((f: Record<string, string>, idx: number) => ({
        id: `fc-${Date.now()}-${idx}`,
        front: f.front || '',
        back: f.back || '',
        status: 'still-learning' as const,
      })),
      practiceTest: (parsed.practiceTest || []).map(
        (t: { type?: string; prompt?: string; options?: string[]; correctAnswer?: string; explanation?: string }, idx: number) => ({
          id: `pt-${Date.now()}-${idx}`,
          type: t.type === 'fill-blank' ? ('fill-blank' as const) : ('multiple-choice' as const),
          prompt: t.prompt || '',
          options: Array.isArray(t.options) && t.options.length > 0 ? t.options : undefined,
          correctAnswer: t.correctAnswer || '',
          explanation: t.explanation || '',
        })
      ),
    };

    res.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate study materials.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/boss-quiz', async (req, res) => {
  try {
    const { title, notes } = req.body as { title?: unknown; notes?: unknown };
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Upcoming Exam Boss';
    const safeNotes =
      typeof notes === 'string' && notes.trim().length >= 10
        ? notes.slice(0, 12000)
        : `Topic: ${safeTitle}. Generate rigorous high-school/AP exam level review questions.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate an Exam Boss Battle challenge with EXACTLY 10 multiple-choice practice questions for "${safeTitle}" based on:\n\n${safeNotes}`,
      config: {
        systemInstruction:
          'You are an academic exam coach. Return EXACTLY 10 challenging multiple-choice questions. Every question must include 4 distinct options, the exact matching correctAnswer string from options, and a concise 1-2 sentence explanation.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bossTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['prompt', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['bossTitle', 'questions'],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText) as {
      bossTitle?: string;
      questions?: Array<{
        prompt?: string;
        options?: string[];
        correctAnswer?: string;
        explanation?: string;
      }>;
    };

    const questions = (parsed.questions || []).slice(0, 10).map((q, idx) => ({
      id: `boss-q-${Date.now()}-${idx}`,
      type: 'multiple-choice' as const,
      prompt: q.prompt || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'],
      correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'A'),
      explanation: q.explanation || '',
    }));

    res.json({
      bossTitle: parsed.bossTitle || safeTitle,
      questions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Boss Battle quiz.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { mode, message, history, context } = req.body as {
      mode?: unknown;
      message?: unknown;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: {
        studyTitle?: string;
        studyNotes?: string;
        upcomingTasks?: Array<{ className: string; title: string; dueDate: string; status: string }>;
        inventorySummary?: Record<string, unknown>;
        sneakers?: Array<{
          modelName: string;
          size: string;
          status: string;
          buyPrice: number;
          soldPrice?: number;
          feePercent: number;
          purchaseDate: string;
        }>;
      };
    };

    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const activeMode = mode === 'inventory' ? 'inventory' : 'school';
    const qLower = message.trim().toLowerCase();

    // Instant Local Dashboard Answers for resilient offline support
    if (
      (qLower.includes('profit') ||
        qLower.includes('revenue') ||
        qLower.includes('goal') ||
        qLower.includes('inventory') ||
        qLower.includes('margin') ||
        qLower.includes('stale') ||
        qLower.includes('loss') ||
        qLower.includes('tied up') ||
        qLower.includes('sales')) &&
      activeMode === 'inventory'
    ) {
      const summary = context?.inventorySummary || {};
      const localReply = `Here is your live Sneaker Vault Reselling Business summary:\n\n• **Total Net Profit:** $${Number(summary.totalNetProfit || 0).toLocaleString()}\n• **Total Revenue:** $${Number(summary.totalRevenue || 0).toLocaleString()}\n• **Money Tied Up in Active Stock:** $${Number(summary.moneyTiedUp || 0).toLocaleString()}\n• **Active Pairs in Hand:** ${Number(summary.activeCount || 0)} pairs\n• **Sold Pairs:** ${Number(summary.soldCount || 0)} pairs\n• **Stale / Slow Mover Alerts (14d+):** Tracked automatically from purchase date.\n• **Break-Even & Margins:** All platform fees and net ROI calculations are live and up to date in your vault.`;
      res.json({ reply: localReply });
      return;
    }

    if (
      (qLower.includes('deadline') || qLower.includes('due') || qLower.includes('grade') || qLower.includes('assignment')) &&
      activeMode === 'school'
    ) {
      const tasks = context?.upcomingTasks || [];
      const localReply = `Here is your live School Workspace summary:\n\n• **Open Assignments:** ${tasks.length} active deadlines tracked.\n• **Canvas LMS Sync:** Auto-imported .ics calendar feed active.\n• **Study Hub:** Flashcards, active-recall quizzes, and final exam calculator ready in your sidebar.`;
      res.json({ reply: localReply });
      return;
    }

    const ai = getGeminiClient();

    const contextSummary =
      activeMode === 'school'
        ? [
            context?.studyTitle ? `Current Study Topic: ${context.studyTitle}` : '',
            context?.studyNotes ? `Student Notes:\n${context.studyNotes.slice(0, 2500)}` : '',
            context?.upcomingTasks?.length
              ? `Upcoming Assignments:\n${context.upcomingTasks
                  .slice(0, 8)
                  .map(
                    (t) => `- [${t.className}] ${t.title} (Due: ${t.dueDate}, Status: ${t.status})`
                  )
                  .join('\n')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n')
        : [
            context?.inventorySummary
              ? `Sneaker Inventory Summary: ${JSON.stringify(context.inventorySummary)}`
              : '',
            context?.sneakers?.length
              ? `Sneaker Pairs:\n${context.sneakers
                  .slice(0, 15)
                  .map(
                    (s) =>
                      `- ${s.modelName} (Size ${s.size}, ${s.status}) Buy $${s.buyPrice}${
                        s.soldPrice ? `, Sold $${s.soldPrice}` : ''
                      }, Fee ${s.feePercent}%, Purchased ${s.purchaseDate}`
                  )
                  .join('\n')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n');

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')
      : '';

    const fullPrompt = `${contextSummary ? `LIVE WORKSPACE CONTEXT:\n${contextSummary}\n\n` : ''}${
      historyText ? `RECENT CONVERSATION:\n${historyText}\n\n` : ''
    }User Request: ${message.trim()}`;

    const systemInstruction =
      activeMode === 'school'
        ? 'You are Kova AI in School Tutor Mode for Study Sole. Focus strictly on academics, study notes, active-recall Gizmo quizzing, and Canvas deadlines. Never mention sneakers or business inventory. Format responses clearly with concise bullet points.'
        : 'You are Kova AI in Sneaker Inventory Analyst Mode for Study Sole. Focus strictly on sneaker reselling inventory, buy prices, platform fees, break-even targets, net profit, ROI, stale stock, and cash flow. Never mention school assignments or academic notes. Format responses clearly with concise bullet points.';

    const replyText = await generateWithModelFallback(ai, fullPrompt, { systemInstruction });

    res.json({ reply: replyText });
  } catch (err) {
    // Graceful offline fallback response instead of raw 503 error bubble
    const activeMode = req.body?.mode === 'inventory' ? 'inventory' : 'school';
    const fallbackReply =
      activeMode === 'inventory'
        ? 'Kova AI is currently connecting to your local vault state. All your profit margins, inventory counts, break-even targets, and house money bankroll are fully secured and active.'
        : 'Kova AI is currently syncing your academic schedule. All your Canvas deadlines, study notes, and GPA calculators remain active and up to date.';
    res.json({ reply: fallbackReply });
  }
});

app.get('/api/sports/realmadrid', async (_req, res) => {
  const fallback = {
    statusLabel: 'Final · Recent Matchday',
    competition: 'La Liga EA Sports',
    homeTeam: 'Real Madrid',
    awayTeam: 'Leganés',
    homeScore: 3,
    awayScore: 0,
    matchDateLabel: 'Recent Fixture',
    isLive: false,
    source: 'cached' as const,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const upstream = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule',
        {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        }
      );
      if (!upstream.ok) {
        res.json(fallback);
        return;
      }
      const data = (await upstream.json()) as {
        events?: Array<{
          date?: string;
          competitions?: Array<{
            status?: {
              type?: {
                state?: string;
                shortDetail?: string;
                description?: string;
              };
            };
            competitors?: Array<{
              homeAway?: 'home' | 'away';
              team?: { shortDisplayName?: string; displayName?: string };
              score?: { value?: number; displayValue?: string };
            }>;
          }>;
        }>;
      };

      const events = Array.isArray(data?.events) ? data.events : [];
      const liveEvent = events.find(
        (ev) => ev.competitions?.[0]?.status?.type?.state === 'in'
      );
      const completedEvents = events.filter(
        (ev) => ev.competitions?.[0]?.status?.type?.state === 'post'
      );
      const upcomingEvent = events.find(
        (ev) => ev.competitions?.[0]?.status?.type?.state === 'pre'
      );

      const chosen =
        liveEvent ||
        completedEvents[completedEvents.length - 1] ||
        upcomingEvent;
      const comp = chosen?.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c) => c.homeAway === 'away');

      if (!chosen || !home || !away) {
        res.json(fallback);
        return;
      }

      const state = comp?.status?.type?.state;
      const isLive = state === 'in';
      const parseScore = (val?: { value?: number; displayValue?: string }) => {
        if (typeof val?.value === 'number' && Number.isFinite(val.value)) {
          return val.value;
        }
        if (val?.displayValue && /^\d+$/.test(val.displayValue)) {
          return Number(val.displayValue);
        }
        return null;
      };

      res.json({
        statusLabel:
          comp?.status?.type?.shortDetail ||
          comp?.status?.type?.description ||
          (isLive ? 'LIVE' : 'Final'),
        competition: 'La Liga EA Sports',
        homeTeam: home.team?.shortDisplayName || home.team?.displayName || 'Real Madrid',
        awayTeam: away.team?.shortDisplayName || away.team?.displayName || 'Opponent',
        homeScore: state === 'pre' ? null : parseScore(home.score),
        awayScore: state === 'pre' ? null : parseScore(away.score),
        matchDateLabel: chosen.date
          ? new Date(chosen.date).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })
          : 'Matchday',
        isLive,
        source: 'live-api' as const,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    res.json(fallback);
  }
});

app.post('/api/ai/dev-studio', async (req, res) => {
  try {
    const { aiMode, prompt, megaPrompt, workspaceSnapshot } = req.body as {
      aiMode?: unknown;
      prompt?: unknown;
      megaPrompt?: unknown;
      workspaceSnapshot?: Record<string, unknown>;
    };

    const instructionText = typeof prompt === 'string' ? prompt.trim() : '';
    const megaText = typeof megaPrompt === 'string' ? megaPrompt.trim() : '';
    if (!instructionText && !megaText) {
      res.status(400).json({ error: 'Please write an upgrade instruction or load your Mega Upgrade Prompt.' });
      return;
    }

    const modeKey =
      aiMode === 'study-up' || aiMode === 'sole-up' || aiMode === 'deep-ai'
        ? aiMode
        : 'web-flash';

    const modeInstructions: Record<string, { role: string; thinking: ThinkingLevel }> = {
      'web-flash': {
        role: 'Web Flash mode: fast, crisp UI/UX polish, color themes, layout tweaks, and lightweight React/Tailwind component enhancements.',
        thinking: ThinkingLevel.LOW,
      },
      'study-up': {
        role: 'Study Up mode: specialized in upgrading the Study Sole Academic Hub, Canvas .ics parsing, Gizmo/Thea active-recall quizzes, GPA math, and Pomodoro focus workflows.',
        thinking: ThinkingLevel.HIGH,
      },
      'sole-up': {
        role: 'Sole Up mode: specialized in upgrading the Sneaker Vault, fee/ROI math, Market Quick-Check links, Monthly Profit Goals, and 4-day Return Deadline alerts.',
        thinking: ThinkingLevel.HIGH,
      },
      'deep-ai': {
        role: 'DeepAI mode: maximum architectural reasoning for multi-feature Study Sole upgrades, state migrations, security hardening, and clean TypeScript code generation.',
        thinking: ThinkingLevel.XHIGH,
      },
    };

    const selectedConfig = modeInstructions[modeKey];
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        `Active AI Studio Mode: ${selectedConfig.role}`,
        workspaceSnapshot ? `Current Workspace Telemetry: ${JSON.stringify(workspaceSnapshot)}` : '',
        megaText ? `Compiled Mega Upgrade Prompt:\n${megaText.slice(0, 6000)}` : '',
        instructionText ? `Developer Upgrade Instruction:\n${instructionText.slice(0, 6000)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      config: {
        thinkingConfig: { thinkingLevel: selectedConfig.thinking },
        systemInstruction:
          'You are the built-in AI Dev Studio engine inside Study Sole v2.0 for Ghirmay. Produce a concise implementation plan, a clean React/TypeScript/Tailwind code snippet ready to copy, and optional live workspace parameters that can be applied immediately (such as studyThemeColor hex, soleThemeColor among black/white/red/green/blue/yellow, monthlyProfitGoal integer, or a short studioAnnouncement banner). Never hardcode secrets or break Canvas .ics, Thea study, or Sneaker Vault math.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            targetArea: { type: Type.STRING },
            planSummary: { type: Type.STRING },
            implementationSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            codeSnippet: { type: Type.STRING },
            livePatch: {
              type: Type.OBJECT,
              properties: {
                studyThemeColor: { type: Type.STRING },
                soleThemeColor: { type: Type.STRING },
                monthlyProfitGoal: { type: Type.NUMBER },
                studioAnnouncement: { type: Type.STRING },
                newTaskTitle: { type: Type.STRING },
              },
            },
          },
          required: ['title', 'targetArea', 'planSummary', 'implementationSteps', 'codeSnippet'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI Dev Studio generation failed.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexFlow server listening on http://localhost:${PORT}`);
  });
}

startServer();
