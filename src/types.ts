export type CharacterType = "pc" | "rival" | "monster" | "other";

export type MoodLabel =
  | "hostile"
  | "unfriendly"
  | "neutral"
  | "friendly"
  | "allied";

export interface MoodEvent {
  id: string;
  timestamp: string;
  label: MoodLabel;
  note: string;
}

export interface Character {
  id: string;
  campaignId: string;
  type: CharacterType;
  name: string;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: number | null;
  notes: string;
  /** One-off combatants created inline in an encounter; hidden from the main roster UI. */
  isTemporary: boolean;
  /** Only meaningful for type "rival". */
  mood: MoodLabel | null;
  moodHistory: MoodEvent[];
}

export type EncounterStatus = "setup" | "active" | "completed";

export interface TurnEntry {
  characterId: string;
  initiative: number;
}

/** A paragraph of scene text: player-facing read-aloud, or a private DM note. */
export type EncounterBlockKind = "read-aloud" | "note";

export interface EncounterBlock {
  id: string;
  kind: EncounterBlockKind;
  text: string;
}

export interface Encounter {
  id: string;
  sessionId: string;
  name: string;
  status: EncounterStatus;
  round: number;
  /** Index into the initiative-sorted turn order. */
  currentTurnIndex: number;
  turnOrder: TurnEntry[];
  /** Ordered scene paragraphs (read-aloud text and DM notes). */
  blocks: EncounterBlock[];
  createdAt: string;
}

export interface Session {
  id: string;
  campaignId: string;
  name: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
}
