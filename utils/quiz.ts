export type Grade = {
  verdict: "correct" | "partial" | "incorrect";
  feedback: string;
};

export async function gradeAnswer(
  question: string,
  reference: string,
  answer: string
): Promise<Grade> {
  const res = await fetch(`${PROXY_URL}/grade`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, reference, answer }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as Grade;
}