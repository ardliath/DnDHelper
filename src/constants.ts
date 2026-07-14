import type { CharacterType, MoodLabel } from "./types";

export const CHARACTER_TYPE_LABELS: Record<CharacterType, string> = {
  pc: "Player Character",
  rival: "Rival",
  monster: "Monster",
  other: "Other",
};

export const CHARACTER_TYPE_ORDER: CharacterType[] = [
  "pc",
  "rival",
  "monster",
  "other",
];

export const MOOD_LABELS: MoodLabel[] = [
  "hostile",
  "unfriendly",
  "neutral",
  "friendly",
  "allied",
];

export const MOOD_DISPLAY: Record<MoodLabel, string> = {
  hostile: "Hostile",
  unfriendly: "Unfriendly",
  neutral: "Neutral",
  friendly: "Friendly",
  allied: "Allied",
};
