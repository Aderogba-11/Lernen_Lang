import type { Rating } from "@/lib/ratings";

export type SrsState = "NEW" | "LEARNING" | "REVIEW";

export type SrsFields = {
  state: SrsState;
  intervalDays: number;
  easeFactor: number;
  lapses: number;
};

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

const MINUTES_10 = 10 / 1440;
const ONE_DAY = 1;

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, Math.min(MAX_EASE, ease));
}

export function scheduleCard(
  prev: {
    state: SrsState;
    intervalDays: number | null;
    easeFactor: number | null;
    lapses: number;
  } | null,
  rating: Rating,
): SrsFields {
  const state = prev?.state ?? "NEW";
  const interval = prev?.intervalDays ?? 0;
  const ease = prev?.easeFactor ?? DEFAULT_EASE;
  const lapses = prev?.lapses ?? 0;

  if (state === "NEW") {
    switch (rating) {
      case "AGAIN":
        return {
          state: "LEARNING",
          intervalDays: MINUTES_10,
          easeFactor: DEFAULT_EASE,
          lapses: 0,
        };
      case "HARD":
        return {
          state: "REVIEW",
          intervalDays: ONE_DAY,
          easeFactor: clampEase(ease - 0.15),
          lapses: 0,
        };
      case "GOOD":
        return {
          state: "REVIEW",
          intervalDays: ONE_DAY,
          easeFactor: DEFAULT_EASE,
          lapses: 0,
        };
      case "EASY":
        return {
          state: "REVIEW",
          intervalDays: 3,
          easeFactor: clampEase(DEFAULT_EASE + 0.15),
          lapses: 0,
        };
    }
  }

  if (state === "LEARNING") {
    const currentInterval = Math.max(interval, MINUTES_10);

    switch (rating) {
      case "AGAIN":
        return {
          state: "LEARNING",
          intervalDays: MINUTES_10,
          easeFactor: clampEase(ease - 0.20),
          lapses: lapses + 1,
        };
      case "HARD":
        return {
          state: "LEARNING",
          intervalDays: ONE_DAY,
          easeFactor: clampEase(ease - 0.15),
          lapses,
        };
      case "GOOD": {
        const newInterval = Math.max(currentInterval * 1.5, ONE_DAY);
        return {
          state: "REVIEW",
          intervalDays: newInterval,
          easeFactor: ease,
          lapses,
        };
      }
      case "EASY":
        return {
          state: "REVIEW",
          intervalDays: 3,
          easeFactor: clampEase(ease + 0.15),
          lapses,
        };
    }
  }

  // REVIEW
  const currentInterval = Math.max(interval, ONE_DAY);

  switch (rating) {
    case "AGAIN":
      return {
        state: "LEARNING",
        intervalDays: MINUTES_10,
        easeFactor: clampEase(ease - 0.20),
        lapses: lapses + 1,
      };
    case "HARD":
      return {
        state: "REVIEW",
        intervalDays: Math.max(ONE_DAY, currentInterval * 1.2),
        easeFactor: clampEase(ease - 0.15),
        lapses,
      };
    case "GOOD":
      return {
        state: "REVIEW",
        intervalDays: currentInterval * ease,
        easeFactor: ease,
        lapses,
      };
    case "EASY":
      return {
        state: "REVIEW",
        intervalDays: currentInterval * 2.5,
        easeFactor: clampEase(ease + 0.15),
        lapses,
      };
  }
}
