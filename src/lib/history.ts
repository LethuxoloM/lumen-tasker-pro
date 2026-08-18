export type Generation = {
  id: string;
  tool: string;
  title: string;
  at: number;
};

const KEY = "laps-history";

export function readHistory(): Generation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Generation[]) : [];
  } catch {
    return [];
  }
}

export function pushHistory(tool: string, title: string) {
  if (typeof window === "undefined") return;
  const next = [
    { id: crypto.randomUUID(), tool, title, at: Date.now() },
    ...readHistory(),
  ].slice(0, 12);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("laps-history"));
}

export function clearHistory() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("laps-history"));
}
