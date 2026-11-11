export type Question = {
  question: string;
  answer: string;
};

export type Source =
  | { kind: "text"; text: string }
  | { kind: "image"; dataUrl: string };

// If you get a "model not found" error, check the current model names in Anthropic's docs
const MODEL = "claude-haiku-5-5";

const SYSTEM_PROMPT = `You write active-recall quiz questions.
The passage is given either as text or as an image of text. If it is an image, read the text in it.
Use ONLY facts stated in the passage. Every answer must be directly supported by the passage.
If the passage does not state something, do not include it in a question or an answer.
Write 3 short-answer questions that test understanding, not trivia.
Return ONLY valid JSON, no other text, in this shape:
{"questions":[{"question":"...","answer":"..."}]}`;

function buildContent(source: Source) {
  if (source.kind === "text") return source.text;

  const [header, data] = source.dataUrl.split(",");
  const mediaType = header.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  return [
    { type: "image", source: { type: "base64", media_type: mediaType, data } },
    { type: "text", text: "Write the quiz based on the text in this image." },
  ];
}

export async function generateQuiz(
  apiKey: string,
  source: Source
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
      messages: [{ role: "user", content: buildContent(source) }],
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