export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function updateStreak(
  prev: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
  },
  now: Date,
): { currentStreak: number; longestStreak: number; lastActivityDate: Date } {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  if (!prev.lastActivityDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(prev.longestStreak, 1),
      lastActivityDate: today,
    };
  }

  const last = new Date(prev.lastActivityDate);
  last.setUTCHours(0, 0, 0, 0);

  const gap = daysBetween(last, today);

  if (gap === 0) {
    return {
      currentStreak: Math.max(prev.currentStreak, 1),
      longestStreak: prev.longestStreak,
      lastActivityDate: last,
    };
  }

  if (gap === 1) {
    const next = prev.currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(prev.longestStreak, next),
      lastActivityDate: today,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: prev.longestStreak,
    lastActivityDate: today,
  };
}
