import { useEffect, useState } from "react";
import { generateQuiz, type Question } from "../../utils/quiz";

export default function App() {
  const [text, setText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the saved API key when the panel opens
  useEffect(() => {
    chrome.storage.local.get("apiKey").then((r) => {
      if (r.apiKey) setApiKey(r.apiKey as string);
    });
  }, []);

  // Receive highlighted text from the content script
  useEffect(() => {
    const listener = (message: { type: string; text?: string }) => {
      if (message.type === "SELECTION" && message.text) {
        setText(message.text);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  function saveKey(value: string) {
    setApiKey(value);
    chrome.storage.local.set({ apiKey: value });
  }

  async function onGenerate() {
    setLoading(true);
    setError("");
    setQuestions([]);
    try {
      const qs = await generateQuiz(apiKey, text);
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
      setRevealed(qs.map(() => false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Recall AI</h2>

      <input
        type="password"
        placeholder="Paste your Anthropic API key"
        value={apiKey}
        onChange={(e) => saveKey(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      {text ? (
        <>
          <p style={{ fontSize: 13, color: "#555" }}>{text}</p>
          <button onClick={onGenerate} disabled={loading || !apiKey}>
            {loading ? "Generating..." : "Generate quiz"}
          </button>
        </>
      ) : (
        <p>Highlight text on any page to get started.</p>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {questions.map((q, i) => (
        <div key={i} style={{ marginTop: 16 }}>
          <strong>
            {i + 1}. {q.question}
          </strong>
          <textarea
            placeholder="Type your answer from memory..."
            value={answers[i]}
            onChange={(e) =>
              setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))
            }
            style={{ width: "100%", marginTop: 6 }}
          />
          <button
            onClick={() =>
              setRevealed(revealed.map((r, j) => (j === i ? true : r)))
            }
          >
            Reveal answer
          </button>
          {revealed[i] && <p style={{ color: "green" }}>{q.answer}</p>}
        </div>
      ))}
    </div>
  );
}