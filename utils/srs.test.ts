import { describe, expect, it } from "vitest";
import { isDue, newCard, review } from "./srs";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("review (SM-2)", () => {
  it("schedules a new card for 1 day after a good answer", () => {
    const next = review(newCard("q", "a", NOW), "good", NOW);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
    expect(next.due).toBe(NOW + DAY);
  });

  it("uses 6 days for the second successful review", () => {
    let card = newCard("q", "a", NOW);
    card = review(card, "good", NOW);
    card = review(card, "good", NOW);
    expect(card.interval).toBe(6);
  });

  it("multiplies the interval by the ease factor after that", () => {
    let card = newCard("q", "a", NOW);
    for (let i = 0; i < 3; i++) card = review(card, "good", NOW);
    expect(card.interval).toBe(15); // round(6 * 2.5)
  });

  it("resets progress but keeps ease when the answer fails", () => {
    let card = newCard("q", "a", NOW);
    card = review(card, "good", NOW);
    card = review(card, "good", NOW);
    card = review(card, "again", NOW);
    expect(card.repetitions).toBe(0);
    expect(card.interval).toBe(1);
    expect(card.ease).toBeCloseTo(2.5);
  });

  it("raises ease on easy and lowers it on hard", () => {
    const base = newCard("q", "a", NOW);
    expect(review(base, "easy", NOW).ease).toBeCloseTo(2.6);
    expect(review(base, "hard", NOW).ease).toBeCloseTo(2.36);
  });

  it("never lets ease drop below 1.3", () => {
    let card = newCard("q", "a", NOW);
    for (let i = 0; i < 30; i++) card = review(card, "hard", NOW);
    expect(card.ease).toBeCloseTo(1.3);
  });

  it("reports whether a card is due", () => {
    const card = newCard("q", "a", NOW);
    expect(isDue(card, NOW)).toBe(true);
    expect(isDue(review(card, "good", NOW), NOW)).toBe(false);
  });
});