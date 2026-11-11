/** How long each scene is on screen. Three cases: no voice (reading pace), a voice file (spread over its length),
 *  or exact times from scripts/voice.mjs (timing.json). All times in seconds. */
export type Scene = {
  type: "hook" | "point" | "steps" | "number" | "compare" | "cta";
  say: string;
  text?: string;
  highlight?: string;
  note?: string;
  title?: string;
  items?: string[];
  value?: string;
  label?: string;
  left?: { title: string; text: string };
  right?: { title: string; text: string };
  keyword?: string;
};
export type ReelData = { title: string; accent?: string; dark?: boolean; handle?: string; scenes: Scene[] };
export type Slot = { start: number; end: number };

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

export const layout = (reel: ReelData, audio: number | null, exact: Slot[] | null): { slots: Slot[]; total: number } => {
  if (exact && exact.length === reel.scenes.length) return { slots: exact, total: exact[exact.length - 1]!.end + 0.6 };
  if (audio) {
    const weights = reel.scenes.map((s) => s.say.length + 6);
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = 0;
    const slots = weights.map((w) => {
      const start = t;
      t += (w / sum) * audio;
      return { start, end: t };
    });
    return { slots, total: audio + 0.5 };
  }
  let t = 0;
  const slots = reel.scenes.map((s) => {
    const start = t;
    t += Math.max(2.2, words(s.say).length * 0.42 + 0.9);
    return { start, end: t };
  });
  return { slots, total: t + 0.4 };
};

/** Which words of the scene's line have been "said" at time t (for the word-by-word caption). */
export const wordsAt = (say: string, slot: Slot, t: number) => {
  const ws = words(say);
  const span = (slot.end - slot.start) * 0.9;
  const total = ws.reduce((a, w) => a + w.length + 2, 0);
  let acc = 0;
  return ws.map((w) => {
    const at = slot.start + (acc / total) * span;
    acc += w.length + 2;
    return { w, on: t >= at };
  });
};
