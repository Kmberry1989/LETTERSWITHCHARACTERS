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
  'claw-crane',
] as const;

export type RetentionModeId = (typeof RETENTION_MODES)[number];

export type GameModeCategory = 'word-games' | 'puzzle-shelf' | 'prize-corner';
export type GameSessionOutcome = 'won' | 'lost' | 'completed' | 'abandoned';

export type GameModeDefinition = {
  id: RetentionModeId;
  title: string;
  shortTitle: string;
  href: string;
  category: GameModeCategory;
  objective: string;
  instructions: string;
  accessibilityInstructions: string;
  scoreLabel: string;
  completionRule: string;
  accent: string;
  iconPath: string;
  description: string;
  controls: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: string;
};

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
    'claw-crane': createDefaultModeProgress(),
  },
};

export const MODE_METADATA: Record<RetentionModeId, GameModeDefinition> = {
  'word-duel': {
    id: 'word-duel',
    title: 'Word Duel',
    shortTitle: 'Duels',
    href: '/dashboard',
    category: 'word-games',
    objective: 'Outscore your opponent by building connected words on the shared board.',
    instructions: 'Place tiles in one row or column, connect to the existing word, then submit your turn.',
    accessibilityInstructions: 'Select rack tiles and board spaces with the keyboard or pointer. Turn status and scoring updates are announced.',
    scoreLabel: 'Match score',
    completionRule: 'The duel ends when the tile bag and a rack are empty, or both players pass.',
    accent: 'from-amber-200 via-orange-100 to-rose-100',
    iconPath: '/arcade-icons/word-duel.png',
    description: 'Play the main word game against another player.',
    controls: 'Tap or drag tiles', difficulty: 'Medium', reward: 'Match rewards',
  },
  'word-search': {
    id: 'word-search',
    title: 'Word Search',
    shortTitle: 'Search',
    href: '/minigames/word-search',
    category: 'word-games',
    objective: 'Find every hidden word in the letter grid.',
    instructions: 'Drag in a straight line across letters. Words may run in either direction.',
    accessibilityInstructions: 'Use pointer drag to trace a word. The word list and found count update after each selection.',
    scoreLabel: 'Words found',
    completionRule: 'Find all five listed words.',
    accent: 'from-sky-200 via-cyan-100 to-emerald-100',
    iconPath: '/arcade-icons/word-search.png',
    description: 'Trace every hidden word in the letter grid.',
    controls: 'Drag across letters', difficulty: 'Easy', reward: 'Clear rewards + daily bonuses',
  },
  'five-in-six': {
    id: 'five-in-six',
    title: '5 in 6',
    shortTitle: '5 in 6',
    href: '/minigames/5-in-6',
    category: 'word-games',
    objective: 'Guess the hidden five-letter word in six attempts.',
    instructions: 'Enter a valid word. Green letters are correct, amber letters belong elsewhere, and gray letters are absent.',
    accessibilityInstructions: 'Use the physical or on-screen keyboard. Letter feedback is exposed through text and color.',
    scoreLabel: 'Guesses',
    completionRule: 'Solve the word before the sixth guess is exhausted.',
    accent: 'from-emerald-200 via-lime-100 to-slate-100',
    iconPath: '/arcade-icons/five-in-six.png',
    description: 'Find the five-letter answer in six guesses.',
    controls: 'Keyboard or tap', difficulty: 'Medium', reward: 'Participation on loss; clear bonus on win',
  },
  'word-connect': {
    id: 'word-connect',
    title: 'Word Connect',
    shortTitle: 'Connect',
    href: '/minigames/word-connect',
    category: 'word-games',
    objective: 'Build enough valid words from the letter wheel.',
    instructions: 'Select adjacent letters in sequence, then submit the completed word.',
    accessibilityInstructions: 'Letters are individual buttons and the current word is announced as it changes.',
    scoreLabel: 'Words found',
    completionRule: 'Discover the target number of accepted words.',
    accent: 'from-fuchsia-200 via-rose-100 to-orange-100',
    iconPath: '/arcade-icons/word-connect.png',
    description: 'Connect letters into as many valid words as you can.',
    controls: 'Tap letters', difficulty: 'Easy', reward: 'Clear rewards + daily bonuses',
  },
  'liquid-sort': {
    id: 'liquid-sort',
    title: 'Liquid Sort',
    shortTitle: 'Liquid Sort',
    href: '/minigames/liquid-sort',
    category: 'puzzle-shelf',
    objective: 'Sort the story inks so every filled vial holds one color.',
    instructions: 'Choose a vial, then choose an empty vial or one topped with the same color.',
    accessibilityInstructions: 'Every vial is a labeled button. Selection and invalid pours are announced.',
    scoreLabel: 'Moves',
    completionRule: 'Fill each non-empty vial with four matching ink layers.',
    accent: 'from-cyan-200 via-sky-100 to-indigo-100',
    iconPath: '/arcade-icons/liquid-sort.png',
    description: 'Pour matching colors together until every tube is sorted.',
    controls: 'Tap two vials', difficulty: 'Medium', reward: 'Clear rewards + daily bonuses',
  },
  'match-sort': {
    id: 'match-sort',
    title: 'Goods Sort',
    shortTitle: 'Goods Sort',
    href: '/minigames/match-sort',
    category: 'puzzle-shelf',
    objective: 'Return every character parcel to its matching story shelf.',
    instructions: 'Select a parcel from the tray, then select the shelf with the same character.',
    accessibilityInstructions: 'Parcels and shelves are labeled buttons. Correct placement and errors are announced.',
    scoreLabel: 'Parcels sorted',
    completionRule: 'Place all twelve parcels on their matching shelves.',
    accent: 'from-amber-200 via-yellow-100 to-orange-100',
    iconPath: '/arcade-icons/goods-sort.png',
    description: 'Move each object to its matching shelf.',
    controls: 'Tap parcel, then shelf', difficulty: 'Easy', reward: 'Clear rewards + daily bonuses',
  },
  solitaire: {
    id: 'solitaire',
    title: 'Solitaire Sprint',
    shortTitle: 'Solitaire',
    href: '/minigames/solitaire',
    category: 'puzzle-shelf',
    objective: 'Restore the four storybook suits before the sprint ends.',
    instructions: 'Build downward in alternating colors and move aces upward to their matching foundations.',
    accessibilityInstructions: 'Cards identify rank, suit, and location. Select a card, then its destination.',
    scoreLabel: 'Score',
    completionRule: 'Build every foundation through rank four.',
    accent: 'from-violet-200 via-purple-100 to-pink-100',
    iconPath: '/arcade-icons/solitaire.png',
    description: 'Build the foundations before the sprint runs out.',
    controls: 'Tap cards and stock', difficulty: 'Hard', reward: 'Clear rewards + daily bonuses',
  },
  wheel: {
    id: 'wheel',
    title: 'Wheel',
    shortTitle: 'Story Wheel',
    href: '/minigames/wheel',
    category: 'word-games',
    objective: 'Reveal and solve the hidden storybook phrase.',
    instructions: 'Spin for a value, choose consonants, buy vowels, or solve the complete phrase.',
    accessibilityInstructions: 'The wheel is a button; its result, bank, guessed letters, and phrase state are announced.',
    scoreLabel: 'Bank',
    completionRule: 'Enter the complete phrase correctly.',
    accent: 'from-emerald-200 via-lime-100 to-yellow-100',
    iconPath: '/arcade-icons/wheel.png',
    description: 'Flick the wheel, guess letters, and solve the phrase.',
    controls: 'Spin and tap', difficulty: 'Medium', reward: 'Clear rewards + daily bonuses',
  },
  'claw-crane': {
    id: 'claw-crane',
    title: 'Claw Crane',
    shortTitle: 'Prize Corner',
    href: '/minigames/claw-crane',
    category: 'prize-corner',
    objective: 'Guide the claw and bring a character prize to the chute.',
    instructions: 'Move above a prize, then drop. Signed-in plays use one Claw Token.',
    accessibilityInstructions: 'Use WASD or the labeled joystick to move, Space or Drop to play, and F for fullscreen.',
    scoreLabel: 'Prizes caught',
    completionRule: 'Deliver a character to the prize chute.',
    accent: 'from-rose-200 via-amber-100 to-sky-100',
    iconPath: '/arcade-icons/claw-crane.svg',
    description: 'Guide the claw to collect characters for your cabinet.',
    controls: 'Joystick, WASD, or touch', difficulty: 'Hard', reward: 'Claw Tokens cost 25 berries',
  },
};

const DAILY_ROTATION: Array<{
  modeId: RetentionModeId;
  title: string;
  description: string;
  targetLabel: string;
}> = [
  {
    modeId: 'word-duel',
    title: 'Friendly Rivalry',
    description: 'Finish a Word Duel and keep the clubhouse story moving.',
    targetLabel: 'Complete 1 Word Duel',
  },
  {
    modeId: 'five-in-six',
    title: 'Six-Guess Secret',
    description: 'Crack the hidden five-letter word before the last row.',
    targetLabel: 'Solve the featured word',
  },
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
    description: 'Stock each toy onto its exact matching shelf with no near-misses.',
    targetLabel: 'Complete every exact-match shelf',
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
  {
    modeId: 'claw-crane',
    title: 'Prize Snatch',
    description: 'Time one clean drop and pull a plush reward out of the crane cabinet.',
    targetLabel: 'Catch 1 prize',
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
    defineQuest('q-claw', 'Lucky Grab', 'Catch 1 crane prize.', 'claw-crane', 1, 30, 45),
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
  [
    defineQuest('q-any-session', 'Daily Warmup', 'Finish any 2 sessions across the suite.', 'any', 2, 20, 30),
    defineQuest('q-five', 'Six-Guess Secret', 'Solve 1 Five in Six board.', 'five-in-six', 1, 25, 35),
    defineQuest('q-duel', 'Clubhouse Match', 'Complete 1 Word Duel.', 'word-duel', 1, 30, 45),
  ],
  [
    defineQuest('q-any-session', 'Puzzle Tour', 'Finish any 2 sessions across the suite.', 'any', 2, 20, 30),
    defineQuest('q-solitaire', 'Suit Keeper', 'Clear 1 Solitaire Sprint.', 'solitaire', 1, 25, 35),
    defineQuest('q-claw', 'Prize Corner', 'Complete 1 Claw Crane play.', 'claw-crane', 1, 30, 45),
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
  options?: {
    sessionId?: string;
    score?: number;
    outcome?: GameSessionOutcome;
    completed?: boolean;
    completeDailyChallenge?: boolean;
    now?: Date;
  }
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
  const outcome = options?.outcome || (options?.completed ? 'completed' : 'abandoned');
  const isClear = outcome === 'won' || outcome === 'completed';
  if (outcome === 'abandoned') {
    return {
      duplicate: false,
      retention,
      rewardBerries: 0,
      rewardExperience: 0,
    };
  }
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
    Boolean(options?.completeDailyChallenge ?? isClear) &&
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

  if (isClear) {
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
