import type { Character } from "./types";

/** A compact "2 attacks · +5 to hit · 1d8+3 slashing" reference line, or null if nothing is set. */
export function formatCombatStatLine(
  c: Pick<Character, "attacks" | "toHit" | "damage">,
): string | null {
  const parts: string[] = [];
  if (c.attacks) parts.push(`${c.attacks} attack${c.attacks === 1 ? "" : "s"}`);
  if (c.toHit) parts.push(`${c.toHit} to hit`);
  if (c.damage) parts.push(c.damage);
  return parts.length > 0 ? parts.join(" · ") : null;
}
