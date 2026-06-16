import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';

export const RETENTION_MODES = [
  'word-duel',
  'word-search',
  'five-in-six',
  'word-connect',
  'liquid-sort',
  'match-sort',
  'solitaire',
  'wheel',
] as const;

export type RetentionModeId = (typeof RETENTION_MODES)[number];

export type QuestDefinition = {
  id: string;
  title: string;
  description: string;
  modeId: RetentionModeId | 'any';
  goal: number;
  rewardBerries: number;
  rewardExperience: number;
};

export type QuestProgress = QuestDefinition & {
  progress: number;
  claimedAt?: string | null;
};

export type DailyChallenge = {
  id: string;
  modeId: RetentionModeId;
  title: string;
  description: string;
  rewardBerries: number;
  rewardExperience: number;
  targetLabel: string;
};

export type ModeProgress = {
  sessionsPlayed: number;
  dailyChallengesCompleted: number;
  bestScore: number;
  lastPlayedAt?: string | null;
};

export type RetentionState = {
  lastActiveDate?: string | null;
  streakCount: number;
  weeklyActivityDates: string[];
  rewardClaimedDates: string[];
  dailyChallengeCompletions: string[];
  dailyChallengeHistory: string[];
  recentSessionIds: string[];
  quests: QuestProgress[];
  modeProgress: Record<RetentionModeId, ModeProgress>;
};

export const DEFAULT_RETENTION_STATE: RetentionState = {
  lastActiveDate: null,
  streakCount: 0,
  weeklyActivityDates: [],
  rewardClaimedDates: [],
  dailyChallengeCompletions: [],
  dailyChallengeHistory: [],
  recentSessionIds: [],
  quests: [],
  modeProgress: {
    'word-duel': createDefaultModeProgress(),
    'word-search': createDefaultModeProgress(),
    'five-in-six': createDefaultModeProgress(),
    'word-connect': createDefaultModeProgress(),
    'liquid-sort': createDefaultModeProgress(),
    'match-sort': createDefaultModeProgress(),
    solitaire: createDefaultModeProgress(),
    wheel: createDefaultModeProgress(),
  },
};

export const MODE_METADATA: Record<
  RetentionModeId,
  {
    title: string;
    href: string;
    accent: string;
    iconPath: string;
  }
> = {
  'word-duel': {
    title: 'Word Duel',
    href: '/dashboard',
    accent: 'from-amber-200 via-orange-100 to-rose-100',
    iconPath: '/arcade-icons/word-duel.png',
  },
  'word-search': {
    title: 'Word Search',
    href: '/minigames/word-search',
    accent: 'from-sky-200 via-cyan-100 to-emerald-100',
    iconPath: '/arcade-icons/word-search.png',
  },
  'five-in-six': {
    title: '5 in 6',
    href: '/minigames/5-in-6',
    accent: 'from-emerald-200 via-lime-100 to-slate-100',
    iconPath: '/arcade-icons/five-in-six.png',
  },
  'word-connect': {
    title: 'Word Connect',
    href: '/minigames/word-connect',
    accent: 'from-fuchsia-200 via-rose-100 to-orange-100',
    iconPath: '/arcade-icons/word-connect.png',
  },
  'liquid-sort': {
    title: 'Liquid Sort',
    href: '/minigames/liquid-sort',
    accent: 'from-cyan-200 via-sky-100 to-indigo-100',
    iconPath: '/arcade-icons/liquid-sort.png',
  },
  'match-sort': {
    title: 'Goods Sort',
    href: '/minigames/match-sort',
    accent: 'from-amber-200 via-yellow-100 to-orange-100',
    iconPath: '/arcade-icons/goods-sort.png',
  },
  solitaire: {
    title: 'Solitaire Sprint',
    href: '/minigames/solitaire',
    accent: 'from-violet-200 via-purple-100 to-pink-100',
    iconPath: '/arcade-icons/solitaire.png',
  },
  wheel: {
    title: 'Wheel',
    href: '/minigames/wheel',
    accent: 'from-emerald-200 via-lime-100 to-yellow-100',
    iconPath: '/arcade-icons/wheel.png',
  },
};

const DAILY_ROTATION: Array<{
  modeId: RetentionModeId;
  title: string;
  description: string;
  targetLabel: string;
}> = [
  {
    modeId: 'word-search',
    title: 'Morning Grid',
    description: 'Clear the featured word search before your coffee cools down.',
    targetLabel: 'Find every hidden word',
  },
  {
    modeId: 'word-connect',
    title: 'Chain Reaction',
    description: 'Build a tidy bundle of words from today’s letter wheel.',
    targetLabel: 'Discover 4 valid words',
  },
  {
    modeId: 'liquid-sort',
    title: 'Pour Perfect',
    description: 'Finish a smooth liquid sort run with no dead-end tube left behind.',
    targetLabel: 'Sort every tube by color',
  },
  {
    modeId: 'match-sort',
    title: 'Snap Sorting',
    description: 'Cleanly file each object into its matching collection.',
    targetLabel: 'Complete all category bins',
  },
  {
    modeId: 'solitaire',
    title: 'Foundation Run',
    description: 'Push a small solitaire deal up through the foundations.',
    targetLabel: 'Build every foundation to 4',
  },
  {
    modeId: 'wheel',
    title: 'Phrase Spin',
    description: 'Solve a fresh phrase before the wheel cools down.',
    targetLabel: 'Solve the phrase',
  },
];

const QUEST_ROTATION: QuestDefinition[][] = [
  [
    defineQuest('q-any-session', 'Daily Warmup', 'Play any 2 sessions across the arcade.', 'any', 2, 20, 30),
    defineQuest('q-word', 'Word Hunter', 'Complete 1 word-based challenge today.', 'word-search', 1, 25, 35),
    defineQuest('q-featured', 'Mode Hopper', 'Play the featured daily mode once.', 'word-connect', 1, 30, 45),
  ],
  [
    defineQuest('q-any-session', 'Quick Drop-In', 'Play any 2 sessions across the arcade.', 'any', 2, 20, 30),
    defineQuest('q-liquid', 'Cool Head', 'Finish 1 liquid sorting run.', 'liquid-sort', 1, 25, 35),
    defineQuest('q-solitaire', 'Longer Lane', 'Play 1 solitaire session.', 'solitaire', 1, 30, 45),
  ],
  [
    defineQuest('q-any-session', 'Daily Warmup', 'Play any 2 sessions across the arcade.', 'any', 2, 20, 30),
    defineQuest('q-match', 'Sorting Sprint', 'Clear 1 match-and-sort board.', 'match-sort', 1, 25, 35),
    defineQuest('q-word-connect', 'Letter Trail', 'Finish 1 word-connect board.', 'word-connect', 1, 30, 45),
  ],
  [
    defineQuest('q-any-session', 'Daily Warmup', 'Play any 2 sessions across the arcade.', 'any', 2, 20, 30),
    defineQuest('q-wheel', 'Lucky Spin', 'Solve 1 wheel phrase.', 'wheel', 1, 25, 35),
    defineQuest('q-word-search', 'Grid Sweep', 'Finish 1 word-search board.', 'word-search', 1, 30, 45),
  ],
];

export function createDefaultModeProgress(): ModeProgress {
  return {
    sessionsPlayed: 0,
    dailyChallengesCompleted: 0,
    bestScore: 0,
    lastPlayedAt: null,
  };
}

function defineQuest(
  id: string,
  title: string,
  description: string,
  modeId: QuestDefinition['modeId'],
  goal: number,
  rewardBerries: number,
  rewardExperience: number
): QuestDefinition {
  return { id, title, description, modeId, goal, rewardBerries, rewardExperience };
}

export function normalizeRetentionState(value?: Partial<RetentionState> | null): RetentionState {
  const safe = value || {};
  const modeProgress = { ...DEFAULT_RETENTION_STATE.modeProgress };

  for (const modeId of RETENTION_MODES) {
    const next = safe.modeProgress?.[modeId];
    modeProgress[modeId] = {
      sessionsPlayed: typeof next?.sessionsPlayed === 'number' ? next.sessionsPlayed : 0,
      dailyChallengesCompleted:
        typeof next?.dailyChallengesCompleted === 'number' ? next.dailyChallengesCompleted : 0,
      bestScore: typeof next?.bestScore === 'number' ? next.bestScore : 0,
      lastPlayedAt: next?.lastPlayedAt || null,
    };
  }

  return {
    lastActiveDate: safe.lastActiveDate || null,
    streakCount: typeof safe.streakCount === 'number' ? safe.streakCount : 0,
    weeklyActivityDates: dedupeRecentDates(safe.weeklyActivityDates || [], 7),
    rewardClaimedDates: dedupeRecentDates(safe.rewardClaimedDates || [], 10),
    dailyChallengeCompletions: dedupeRecentDates(safe.dailyChallengeCompletions || [], 10),
    dailyChallengeHistory: Array.isArray(safe.dailyChallengeHistory) ? safe.dailyChallengeHistory.slice(-10) : [],
    recentSessionIds: dedupeRecentValues(safe.recentSessionIds || [], 20),
    quests: Array.isArray(safe.quests)
      ? safe.quests.map((quest) => ({
          ...quest,
          progress: typeof quest.progress === 'number' ? quest.progress : 0,
          claimedAt: quest.claimedAt || null,
        }))
      : [],
    modeProgress,
  };
}

export function getDayKey(date = new Date()) {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

function getRotationIndex(date = new Date(), modulo: number) {
  const epoch = startOfDay(new Date('2026-01-01T00:00:00.000Z'));
  const day = Math.abs(differenceInCalendarDays(startOfDay(date), epoch));
  return day % modulo;
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const item = DAILY_ROTATION[getRotationIndex(date, DAILY_ROTATION.length)];
  return {
    id: `daily-${getDayKey(date)}`,
    modeId: item.modeId,
    title: item.title,
    description: item.description,
    rewardBerries: 45,
    rewardExperience: 60,
    targetLabel: item.targetLabel,
  };
}

export function getQuestSet(date = new Date()): QuestProgress[] {
  const source = QUEST_ROTATION[getRotationIndex(date, QUEST_ROTATION.length)];
  return source.map((quest) => ({
    ...quest,
    progress: 0,
    claimedAt: null,
  }));
}

export function ensureQuestSet(retention: RetentionState, date = new Date()) {
  const dayKey = getDayKey(date);
  const expected = getQuestSet(date);
  const hasToday = retention.dailyChallengeHistory.includes(`quests-${dayKey}`);
  if (hasToday && retention.quests.length === expected.length) {
    return retention.quests;
  }
  return expected;
}

export function hasClaimedRewardToday(retention: RetentionState, date = new Date()) {
  const dayKey = getDayKey(date);
  return retention.rewardClaimedDates.includes(dayKey);
}

export function hasCompletedDailyChallenge(retention: RetentionState, date = new Date()) {
  return retention.dailyChallengeCompletions.includes(getDayKey(date));
}

export function getWeeklyActivityCount(retention: RetentionState, date = new Date()) {
  const start = startOfDay(date);
  return retention.weeklyActivityDates.filter((value) => {
    const diff = differenceInCalendarDays(start, startOfDay(new Date(value)));
    return diff >= 0 && diff < 7;
  }).length;
}

export function getRetentionSummary(retention: RetentionState, date = new Date()) {
  const dailyChallenge = getDailyChallenge(date);
  const quests = ensureQuestSet(retention, date);
  const completedQuests = quests.filter((quest) => quest.progress >= quest.goal).length;
  const totalQuestProgress = quests.reduce((sum, quest) => sum + Math.min(quest.goal, quest.progress), 0);
  const totalQuestGoal = quests.reduce((sum, quest) => sum + quest.goal, 0);

  return {
    dailyChallenge,
    quests,
    completedQuests,
    totalQuestProgress,
    totalQuestGoal,
    weeklyActivityCount: getWeeklyActivityCount(retention, date),
    rewardClaimedToday: hasClaimedRewardToday(retention, date),
    dailyChallengeCompleted: hasCompletedDailyChallenge(retention, date),
  };
}

export function getNextActionHref(retention: RetentionState, hasUsersTurn: boolean, date = new Date()) {
  if (hasUsersTurn) return '/game';
  const dailyChallenge = getDailyChallenge(date);
  if (!hasCompletedDailyChallenge(retention, date)) {
    return MODE_METADATA[dailyChallenge.modeId].href;
  }
  return '/minigames';
}

function dedupeRecentDates(values: string[], maxDays: number) {
  const seen = new Set<string>();
  const now = startOfDay(new Date());
  const result: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    const diff = differenceInCalendarDays(now, startOfDay(new Date(value)));
    if (diff >= 0 && diff <= maxDays) {
      seen.add(value);
      result.push(value);
    }
  }

  return result.sort().slice(-maxDays);
}

function dedupeRecentValues(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result.slice(-limit);
}

export function rollWeeklyActivity(existing: string[], today = new Date()) {
  const dayKey = getDayKey(today);
  return dedupeRecentDates([...existing, dayKey], 7);
}

export function updateStreak(lastActiveDate: string | null | undefined, streakCount: number, today = new Date()) {
  const todayKey = getDayKey(today);
  if (!lastActiveDate) return 1;

  const lastDate = startOfDay(new Date(lastActiveDate));
  const diff = differenceInCalendarDays(startOfDay(today), lastDate);
  if (diff <= 0) return streakCount;
  if (diff === 1) return streakCount + 1;
  return 1;
}

export function rotateRetentionForToday(retention: RetentionState, today = new Date()): RetentionState {
  const dayKey = getDayKey(today);
  const questMarker = `quests-${dayKey}`;
  const quests = ensureQuestSet(retention, today);
  if (retention.dailyChallengeHistory.includes(questMarker) && retention.quests.length === quests.length) {
    return retention;
  }
  return {
    ...retention,
    quests,
    dailyChallengeHistory: [...retention.dailyChallengeHistory.filter((entry) => !entry.startsWith('quests-')), questMarker].slice(-10),
  };
}

export function applyArcadeSession(
  retentionValue: Partial<RetentionState> | null | undefined,
  modeId: RetentionModeId,
  options?: { sessionId?: string; score?: number; completed?: boolean; completeDailyChallenge?: boolean; now?: Date }
) {
  const now = options?.now || new Date();
  const dayKey = getDayKey(now);
  let retention = rotateRetentionForToday(normalizeRetentionState(retentionValue), now);
  const sessionId = options?.sessionId?.trim();

  if (sessionId && retention.recentSessionIds.includes(sessionId)) {
    return {
      duplicate: true,
      retention,
      rewardBerries: 0,
      rewardExperience: 0,
    };
  }

  const dailyChallenge = getDailyChallenge(now);
  const nextModeProgress = {
    ...retention.modeProgress,
    [modeId]: {
      ...retention.modeProgress[modeId],
      sessionsPlayed: retention.modeProgress[modeId].sessionsPlayed + 1,
      bestScore: Math.max(retention.modeProgress[modeId].bestScore, options?.score || 0),
      lastPlayedAt: now.toISOString(),
    },
  };

  const nextQuests = retention.quests.map((quest) => {
    const matchesMode = quest.modeId === 'any' || quest.modeId === modeId;
    if (!matchesMode) return quest;
    return {
      ...quest,
      progress: Math.min(quest.goal, quest.progress + 1),
    };
  });

  retention = {
    ...retention,
    lastActiveDate: dayKey,
    streakCount: updateStreak(retention.lastActiveDate, retention.streakCount, now),
    weeklyActivityDates: rollWeeklyActivity(retention.weeklyActivityDates, now),
    recentSessionIds: sessionId
      ? [...retention.recentSessionIds, sessionId].slice(-20)
      : retention.recentSessionIds,
    quests: nextQuests,
    modeProgress: nextModeProgress,
  };

  let rewardBerries = 8;
  let rewardExperience = 12;

  const shouldCompleteDailyChallenge =
    Boolean(options?.completeDailyChallenge ?? options?.completed) &&
    dailyChallenge.modeId === modeId &&
    !retention.dailyChallengeCompletions.includes(dayKey);

  if (shouldCompleteDailyChallenge) {
    retention = {
      ...retention,
      dailyChallengeCompletions: [...retention.dailyChallengeCompletions, dayKey].slice(-10),
      modeProgress: {
        ...retention.modeProgress,
        [modeId]: {
          ...retention.modeProgress[modeId],
          dailyChallengesCompleted: retention.modeProgress[modeId].dailyChallengesCompleted + 1,
        },
      },
    };
    rewardBerries += dailyChallenge.rewardBerries;
    rewardExperience += dailyChallenge.rewardExperience;
  }

  if (options?.completed) {
    rewardBerries += 6;
    rewardExperience += 10;
  }

  return {
    duplicate: false,
    retention,
    rewardBerries,
    rewardExperience,
  };
}

export function claimDailyReward(retentionValue: Partial<RetentionState> | null | undefined, now = new Date()) {
  const dayKey = getDayKey(now);
  const retention = rotateRetentionForToday(normalizeRetentionState(retentionValue), now);
  const summary = getRetentionSummary(retention, now);
  const activeToday = retention.lastActiveDate === dayKey;

  if (summary.rewardClaimedToday) {
    return { retention, rewardBerries: 0, rewardExperience: 0, claimed: false };
  }

  const qualifyingActions = Number(summary.dailyChallengeCompleted) + summary.completedQuests + (activeToday ? 1 : 0);
  if (qualifyingActions <= 0) {
    return { retention, rewardBerries: 0, rewardExperience: 0, claimed: false };
  }

  return {
    retention: {
      ...retention,
      rewardClaimedDates: [...retention.rewardClaimedDates, dayKey].slice(-10),
    },
    rewardBerries: 35,
    rewardExperience: 45,
    claimed: true,
  };
}

export function getUpcomingWeeklyWindow(date = new Date()) {
  const start = startOfDay(date);
  return {
    from: format(start, 'MMM d'),
    to: format(addDays(start, 6), 'MMM d'),
  };
}
