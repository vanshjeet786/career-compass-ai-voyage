// Multi-mode assessment analytics: Latest / Trend / Overall

export type ViewMode = 'latest' | 'trend' | 'overall';
export type Timeframe = 'all' | '6month' | '1year';

export interface AssessmentWithScores {
  id: string;
  completed_at: string;
  scores: Record<string, number>;
  recommended_careers: string[];
}

export interface Improvement {
  category: string;
  change: number;
  baselineScore: number;
  currentScore: number;
}

export interface Strength {
  category: string;
  score: number;
}

export interface CareerMatch {
  career: string;
  frequency: number;
  lastSeen?: string;
}

function getNumberScore(val: number | string | undefined): number | null {
  if (val === undefined || val === null) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function averageScores(assessments: AssessmentWithScores[]): Record<string, number> {
  if (assessments.length === 0) return {};

  const sums: Record<string, { total: number; count: number }> = {};
  for (const a of assessments) {
    for (const [category, rawVal] of Object.entries(a.scores)) {
      const val = getNumberScore(rawVal);
      if (val === null) continue;
      if (!sums[category]) sums[category] = { total: 0, count: 0 };
      sums[category].total += val;
      sums[category].count += 1;
    }
  }

  const result: Record<string, number> = {};
  for (const [cat, { total, count }] of Object.entries(sums)) {
    result[cat] = Number((total / count).toFixed(1));
  }
  return result;
}

export function filterByTimeframe(
  assessments: AssessmentWithScores[],
  timeframe: Timeframe
): AssessmentWithScores[] {
  if (timeframe === 'all') return assessments;

  const now = new Date();
  const cutoff = new Date();
  if (timeframe === '6month') cutoff.setMonth(now.getMonth() - 6);
  else if (timeframe === '1year') cutoff.setFullYear(now.getFullYear() - 1);

  return assessments.filter(a => new Date(a.completed_at) >= cutoff);
}

/**
 * Detects categories with >0.3 point improvement.
 * - latest: compared to previous single assessment
 * - trend: compared to average of last 5 before current
 * - overall: compared to average of all previous assessments
 */
export function calculateImprovements(
  assessments: AssessmentWithScores[],
  mode: ViewMode
): Improvement[] {
  if (assessments.length < 2) return [];

  // Sort chronologically (oldest first)
  const sorted = [...assessments].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted.slice(0, -1);

  let baseline: Record<string, number>;

  if (mode === 'latest') {
    baseline = previous[previous.length - 1]?.scores || {};
  } else if (mode === 'trend') {
    const last5 = previous.slice(-5);
    baseline = averageScores(last5);
  } else {
    baseline = averageScores(previous);
  }

  const improvements: Improvement[] = [];

  for (const [category, currentRaw] of Object.entries(latest.scores)) {
    const currentScore = getNumberScore(currentRaw);
    const baselineScore = getNumberScore(baseline[category]);
    if (currentScore === null || baselineScore === null) continue;

    const change = Number((currentScore - baselineScore).toFixed(1));
    if (change > 0.3) {
      improvements.push({ category, change, baselineScore, currentScore });
    }
  }

  return improvements.sort((a, b) => b.change - a.change);
}

/**
 * Returns top 3 categories by score.
 * - latest: only latest assessment
 * - trend: average of last 5
 * - overall: average of all
 */
export function calculateTopStrengths(
  assessments: AssessmentWithScores[],
  mode: ViewMode
): Strength[] {
  if (assessments.length === 0) return [];

  const sorted = [...assessments].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  let scores: Record<string, number>;

  if (mode === 'latest') {
    scores = sorted[sorted.length - 1].scores;
  } else if (mode === 'trend') {
    scores = averageScores(sorted.slice(-5));
  } else {
    scores = averageScores(sorted);
  }

  return Object.entries(scores)
    .map(([category, rawVal]) => {
      const score = getNumberScore(rawVal);
      return score !== null ? { category, score } : null;
    })
    .filter((s): s is Strength => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Career frequency across assessments.
 * - latest: careers from latest only (frequency = 1)
 * - trend: most frequent in last 5
 * - overall: most frequent across all
 */
export function calculateCareerMatches(
  assessments: AssessmentWithScores[],
  mode: ViewMode
): CareerMatch[] {
  if (assessments.length === 0) return [];

  const sorted = [...assessments].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  let targets: AssessmentWithScores[];

  if (mode === 'latest') {
    targets = [sorted[sorted.length - 1]];
  } else if (mode === 'trend') {
    targets = sorted.slice(-5);
  } else {
    targets = sorted;
  }

  const freq: Record<string, { count: number; lastSeen: string }> = {};

  for (const a of targets) {
    for (const career of a.recommended_careers) {
      if (!freq[career]) freq[career] = { count: 0, lastSeen: a.completed_at };
      freq[career].count += 1;
      if (new Date(a.completed_at) > new Date(freq[career].lastSeen)) {
        freq[career].lastSeen = a.completed_at;
      }
    }
  }

  return Object.entries(freq)
    .map(([career, { count, lastSeen }]) => ({ career, frequency: count, lastSeen }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
}
