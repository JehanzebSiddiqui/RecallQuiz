import { useEffect, useState } from "react";
import {
  generateQuiz,
  gradeAnswer,
  type Grade,
  type Question,
  type Source,
} from "../../utils/quiz";
import { cropImage, type Rect } from "../../utils/crop";

type Message =
  | { type: "SELECTION"; text: string }
  | { type: "SNIP_CAPTURED"; dataUrl: string; rect: Rect; viewportWidth: number };

const VERDICT = {
  correct: { label: "Correct", color: "green" },
  partial: { label: "Partly right", color: "darkorange" },
  incorrect: { label: "Not quite", color: "crimson" },
} as const;

export default function App() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [grades, setGrades] = useState<(Grade | null)[]>([]);
  const [grading, setGrading] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The thing we will make a quiz from: a snip/pasted image, or highlighted text
  const source: Source | null = image
    ? { kind: "image", dataUrl: image }
    : text
    ? { kind: "text", text }
    : null;

  // Messages from the content script and background script
  useEffect(() => {
    const listener = (message: Message) => {
      if (message.type === "SELECTION") {
        setText(message.text);
        setImage(null);
        setQuestions([]);
      } else if (message.type === "SNIP_CAPTURED") {
        cropImage(message.dataUrl, message.rect, message.viewportWidth)
          .then((cropped) => {
            setImage(cropped);
            setText("");
            setQuestions([]);
          })
          .catch(() => setError("Could not crop the screenshot"));
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Ctrl+V a screenshot (for example from Win+Shift+S)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setText("");
        setQuestions([]);
      };
      reader.readAsDataURL(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function onSnip() {
    setError("");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "START_SNIP" });
    } catch {
      setError(
        "Can't snip on this page. Refresh the page and try again (Chrome's own pages can't be snipped)."
      );
    }
  }

  async function onGenerate() {
    if (!source) return;
    setLoading(true);
    setError("");
    setQuestions([]);
    try {
      const qs = await generateQuiz(source);
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
      setRevealed(qs.map(() => false));
      setGrades(qs.map(() => null));
      setGrading(qs.map(() => false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onCheck(i: number) {
    const q = questions[i];
    setError("");
    setGrading((g) => g.map((v, j) => (j === i ? true : v)));
    try {
      const grade = await gradeAnswer(q.question, q.answer, answers[i]);
      setGrades((gs) => gs.map((x, j) => (j === i ? grade : x)));
      setRevealed((rs) => rs.map((r, j) => (j === i ? true : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGrading((g) => g.map((v, j) => (j === i ? false : v)));
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Recall AI</h2>

      <button onClick={onSnip}>Snip a region</button>
      <p style={{ fontSize: 12, color: "#777" }}>
        Or highlight text on the page, or paste a screenshot (Ctrl+V).
      </p>

      {image && (
        <img
          src={image}
          alt="Snipped region"
          style={{ maxWidth: "100%", border: "1px solid #ccc" }}
        />
      )}
      {text && <p style={{ fontSize: 13, color: "#555" }}>{text}</p>}

      {source && (
        <div style={{ marginTop: 8 }}>
          <button onClick={onGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate quiz"}
          </button>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {questions.map((q, i) => {
        const grade = grades[i];
        return (
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
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => onCheck(i)}
                disabled={grading[i] || !answers[i]?.trim()}
              >
                {grading[i] ? "Checking..." : "Check my answer"}
              </button>
              <button
                onClick={() =>
                  setRevealed((rs) => rs.map((r, j) => (j === i ? true : r)))
                }
              >
                Reveal answer
              </button>
            </div>
            {grade && (
              <p style={{ color: VERDICT[grade.verdict].color }}>
                <strong>{VERDICT[grade.verdict].label}.</strong> {grade.feedback}
              </p>
            )}
            {revealed[i] && (
              <p style={{ color: "#555" }}>
                <strong>Reference answer:</strong> {q.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}