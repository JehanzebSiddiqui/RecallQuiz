export type Question = {
  question: string;
  answer: string;
};

export type Source =
  | { kind: "text"; text: string }
  | { kind: "image"; dataUrl: string };

const PROXY_URL = "https://recall-proxy.jehanzeb.workers.dev";

function buildBody(source: Source) {
  if (source.kind === "text") return { text: source.text };

  const [header, data] = source.dataUrl.split(",");
  const mediaType = header.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  return { image: { mediaType, data } };
}

export async function generateQuiz(source: Source): Promise<Question[]> {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildBody(source)),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data.questions as Question[];
}