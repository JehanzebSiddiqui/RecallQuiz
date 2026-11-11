import { useState } from "react";
import Study from "./Study";
import Review from "./Review";
import { useCards } from "../../utils/useCards";
import { isDue } from "../../utils/srs";

export default function App() {
  const [tab, setTab] = useState<"study" | "review">("study");
  const cards = useCards();
  const dueCount = cards.filter((c) => isDue(c)).length;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Recall AI</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("study")}
          style={{ fontWeight: tab === "study" ? "bold" : "normal" }}
        >
          Study
        </button>
        <button
          onClick={() => setTab("review")}
          style={{ fontWeight: tab === "review" ? "bold" : "normal" }}
        >
          Review ({dueCount})
        </button>
      </div>

      {/* Study stays mounted so snips still arrive while you're on the Review tab */}
      <div style={{ display: tab === "study" ? "block" : "none" }}>
        <Study />
      </div>
      {tab === "review" && <Review />}
    </div>
  );
}