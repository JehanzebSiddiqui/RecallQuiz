import { useEffect, useState } from "react";
import { loadCards } from "./cards";
import type { Card } from "./srs";

export function useCards(): Card[] {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    loadCards().then(setCards);
    const onChange = (_changes: unknown, area: string) => {
      if (area === "local") loadCards().then(setCards);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  return cards;
}