import { useState } from "react";
import { gradeAnswer, type Grade } from "../../utils/quiz";
import {
  isDue,
  review,
  suggestRating,
  type Card,
  type Rating,
} from "../../utils/srs";
import { loadCards, saveCards } from "../../utils/cards";
import { useCards } from "../../utils/useCards";

const RATINGS: { value: Rating; label: string }[] = [
  { value: "again", label: "Again" },
  { value: "hard", label: "Hard" },
  { value: "good", label: "Good" },
  { value: "easy", label: "Easy" },
];

async function rate(id: string, rating: Rating) {
  const cards = await loadCards();
  await saveCards(cards.map((c) => (c.id === id ? review(c, rating) : c)));
}

function ReviewCard({ card }: { card: Card }) {
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function onCheck() {
    setChecking(true);
    setError("");
    try {
      setGrade(await gradeAnswer(card.question, card.answer, answer));
      setRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setChecking(false);
    }
  }

  const suggested = grade ? suggestRating(grade.verdict) : null;

  return (
    <div>
      <strong>{card.question}</strong>
      <textarea
        placeholder="Type your answer from memory..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        style={{ width: "100%", marginTop: 6 }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onCheck} disabled={checking || !answer.trim()}>
          {checking ? "Checking..." : "Check my answer"}
        </button>
        <button onClick={() => setRevealed(true)}>Reveal answer</button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {grade && (
        <p>
          <strong>{grade.verdict}.</strong> {grade.feedback}
        </p>
      )}

      {revealed && (
        <>
          <p style={{ color: "#555" }}>
            <strong>Reference answer:</strong> {card.answer}
          </p>
          <p style={{ fontSize: 13, marginBottom: 4 }}>How well did you recall it?</p>
          <div style={{ display: "flex", gap: 8 }}>
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => rate(card.id, r.value)}
                style={{
                  fontWeight: suggested === r.value ? "bold" : "normal",
                  outline: suggested === r.value ? "2px solid #4f8cff" : "none",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Review() {
  const cards = useCards();
  const due = cards.filter((c) => isDue(c)).sort((a, b) => a.due - b.due);

  if (cards.length === 0) {
    return <p>No saved questions yet. Generate a quiz and click "Save for review".</p>;
  }

  if (due.length === 0) {
    const next = Math.min(...cards.map((c) => c.due));
    return (
      <p>
        Nothing due right now. {cards.length} saved. Next review:{" "}
        {new Date(next).toLocaleString()}.
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "#777" }}>
        {due.length} due · {cards.length} saved
      </p>
      {/* key makes React reset the typed answer when the card changes */}
      <ReviewCard key={due[0].id} card={due[0]} />
    </div>
  );
}