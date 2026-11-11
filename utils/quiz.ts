export type Question = {
  question: string;
  answer: string;
};

// If you get a "model not found" error, check the current model names in Anthropic's docs
const MODEL = "claude-haiku-5-5";

const SYSTEM_PROMPT = `You write active-recall quiz questions.
Use ONLY facts stated in the passage the user gives you. Do not add outside facts.
Write 3 short-answer questions that test understanding, not trivia.
Return ONLY valid JSON, no other text, in this shape:
{"questions":[{"question":"...","answer":"..."}]}`;

export async function generateQuiz(
  apiKey: string,
  passage: string
): Promise<Question[]> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: passage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text: string = data.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("");

  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned).questions as Question[];
}