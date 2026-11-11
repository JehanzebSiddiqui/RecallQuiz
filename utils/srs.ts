export type Card = {
  id: string;
  question: string;
  answer: string;
  ease: number; // ease factor, starts at 2.5
  interval: number; // days until next review
  repetitions: number; // successful reviews in a row
  due: number; // timestamp in ms
};

export type Rating = "again" | "hard" | "good" | "easy";

// SM-2 quality scores (0-5) for each button
const QUALITY: Record<Rating, number> = { again: 1, hard: 3, good: 4, easy: 5 };
const DAY = 24 * 60 * 60 * 1000;

export function newCard(
  question: string,
  answer: string,
  now = Date.now()
): Card {
  return {
    id: crypto.randomUUID(),
    question,
    answer,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    due: now,
  };
}

export function review(card: Card, rating: Rating, now = Date.now()): Card {
  const q = QUALITY[rating];
  let { ease, interval, repetitions } = card;

  if (q < 3) {
    // Failed: start the card over, but leave the ease factor alone
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease);
    repetitions += 1;
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  return { ...card, ease, interval, repetitions, due: now + interval * DAY };
}

export function isDue(card: Card, now = Date.now()): boolean {
  return card.due <= now;
}

// Turn the AI verdict into a suggested button
export function suggestRating(
  verdict: "correct" | "partial" | "incorrect"
): Rating {
  if (verdict === "correct") return "good";
  if (verdict === "partial") return "hard";
  return "again";
}