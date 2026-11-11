import { newCard, type Card } from "./srs";

const KEY = "cards";

export async function loadCards(): Promise<Card[]> {
  const result = await chrome.storage.local.get(KEY);
  return (result[KEY] as Card[] | undefined) ?? [];
}

export async function saveCards(cards: Card[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: cards });
}

export async function addCard(question: string, answer: string): Promise<void> {
  const cards = await loadCards();
  if (cards.some((c) => c.question === question)) return; // no duplicates
  await saveCards([...cards, newCard(question, answer)]);
}