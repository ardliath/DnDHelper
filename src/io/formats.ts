import type {
  CharacterType,
  MoodLabel,
  NoteKind,
} from "../types";
import { CHARACTER_TYPE_ORDER, MOOD_LABELS } from "../constants";

export const NOTE_KINDS: NoteKind[] = ["read-aloud", "note"];

/**
 * On-disk JSON exchange formats for DnD Helper.
 *
 * Design notes:
 * - Characters are referenced by NAME. Existing roster characters are matched
 *   by name; a combatant that names something not in the roster must carry its
 *   own stat block (at least maxHp) and becomes a per-encounter combatant.
 * - Every file carries `formatVersion` (integer) and `kind`.
 */

export const FORMAT_VERSION = 1;

export type ExportKind = "character" | "encounter" | "session" | "campaign";

export interface CharacterSpec {
  name: string;
  type: CharacterType;
  maxHp: number;
  ac?: number | null;
  notes?: string;
  /** Only meaningful for type "rival". */
  mood?: MoodLabel;
  /** Quick-reference combat stats, for running the creature in a fight. */
  attacks?: number;
  /** Free text, e.g. "+5". */
  toHit?: string;
  /** Free text, e.g. "1d8+3 slashing". */
  damage?: string;
  /** Special abilities / traits, freeform. */
  abilities?: string;
  /** A portrait — either a data URI or an http(s) link. Roster characters only. */
  avatar?: string;
}

export interface CombatantSpec {
  name: string;
  initiative?: number;
  /** Inline stat block; used only when `name` is not found in the roster. */
  type?: CharacterType;
  maxHp?: number;
  ac?: number | null;
  notes?: string;
  attacks?: number;
  toHit?: string;
  damage?: string;
  abilities?: string;
}

export interface BlockSpec {
  kind: NoteKind;
  text: string;
}

export interface EncounterSpec {
  name: string;
  blocks?: BlockSpec[];
  combatants?: CombatantSpec[];
}

export interface SessionSpec {
  name: string;
  /** Characters to ensure exist in the campaign roster (recurring NPCs, PCs). */
  roster?: CharacterSpec[];
  /** Freeform journal — exploration, travel, roleplay; not tied to any encounter. */
  notes?: BlockSpec[];
  encounters?: EncounterSpec[];
}

export interface CampaignSpec {
  name: string;
  roster?: CharacterSpec[];
  sessions?: SessionSpec[];
}

export interface CharacterFile {
  formatVersion: number;
  kind: "character";
  character: CharacterSpec;
}
export interface EncounterFile {
  formatVersion: number;
  kind: "encounter";
  encounter: EncounterSpec;
}
export interface SessionFile {
  formatVersion: number;
  kind: "session";
  session: SessionSpec;
}
export interface CampaignFile {
  formatVersion: number;
  kind: "campaign";
  campaign: CampaignSpec;
}

export type AnyFile = CharacterFile | EncounterFile | SessionFile | CampaignFile;

export type ParseResult =
  | { ok: true; file: AnyFile }
  | { ok: false; errors: string[] };

// --- Validation helpers ----------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Shared combat-stat validation for both CharacterSpec and CombatantSpec. */
function validateCombatStats(
  v: Record<string, unknown>,
  path: string,
  errors: string[],
): void {
  if (
    v.attacks !== undefined &&
    (typeof v.attacks !== "number" || !Number.isFinite(v.attacks) || v.attacks <= 0)
  ) {
    errors.push(`${path}.attacks must be a number greater than 0.`);
  }
  if (v.toHit !== undefined && typeof v.toHit !== "string") {
    errors.push(`${path}.toHit must be a string.`);
  }
  if (v.damage !== undefined && typeof v.damage !== "string") {
    errors.push(`${path}.damage must be a string.`);
  }
  if (v.abilities !== undefined && typeof v.abilities !== "string") {
    errors.push(`${path}.abilities must be a string.`);
  }
}

function validateCharacterSpec(
  v: unknown,
  path: string,
  errors: string[],
  { requireType }: { requireType: boolean },
): void {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (typeof v.name !== "string" || v.name.trim() === "") {
    errors.push(`${path}.name is required and must be a non-empty string.`);
  }
  if (v.type !== undefined) {
    if (!CHARACTER_TYPE_ORDER.includes(v.type as CharacterType)) {
      errors.push(
        `${path}.type must be one of: ${CHARACTER_TYPE_ORDER.join(", ")}.`,
      );
    }
  } else if (requireType) {
    errors.push(
      `${path}.type is required (one of: ${CHARACTER_TYPE_ORDER.join(", ")}).`,
    );
  }
  if (
    typeof v.maxHp !== "number" ||
    !Number.isFinite(v.maxHp) ||
    v.maxHp <= 0
  ) {
    errors.push(`${path}.maxHp is required and must be a number greater than 0.`);
  }
  if (v.ac !== undefined && v.ac !== null && typeof v.ac !== "number") {
    errors.push(`${path}.ac must be a number or null.`);
  }
  if (v.notes !== undefined && typeof v.notes !== "string") {
    errors.push(`${path}.notes must be a string.`);
  }
  if (
    v.mood !== undefined &&
    !MOOD_LABELS.includes(v.mood as MoodLabel)
  ) {
    errors.push(`${path}.mood must be one of: ${MOOD_LABELS.join(", ")}.`);
  }
  if (v.avatar !== undefined && typeof v.avatar !== "string") {
    errors.push(`${path}.avatar must be a string.`);
  }
  validateCombatStats(v, path, errors);
}

function validateCombatantSpec(
  v: unknown,
  path: string,
  errors: string[],
): void {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (typeof v.name !== "string" || v.name.trim() === "") {
    errors.push(`${path}.name is required and must be a non-empty string.`);
  }
  if (
    v.initiative !== undefined &&
    (typeof v.initiative !== "number" || !Number.isFinite(v.initiative))
  ) {
    errors.push(`${path}.initiative must be a number.`);
  }
  if (v.type !== undefined && !CHARACTER_TYPE_ORDER.includes(v.type as CharacterType)) {
    errors.push(
      `${path}.type must be one of: ${CHARACTER_TYPE_ORDER.join(", ")}.`,
    );
  }
  if (
    v.maxHp !== undefined &&
    (typeof v.maxHp !== "number" || !Number.isFinite(v.maxHp) || v.maxHp <= 0)
  ) {
    errors.push(`${path}.maxHp must be a number greater than 0.`);
  }
  if (v.ac !== undefined && v.ac !== null && typeof v.ac !== "number") {
    errors.push(`${path}.ac must be a number or null.`);
  }
  if (v.notes !== undefined && typeof v.notes !== "string") {
    errors.push(`${path}.notes must be a string.`);
  }
  validateCombatStats(v, path, errors);
}

function validateBlockSpec(v: unknown, path: string, errors: string[]): void {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (!NOTE_KINDS.includes(v.kind as NoteKind)) {
    errors.push(`${path}.kind must be one of: ${NOTE_KINDS.join(", ")}.`);
  }
  if (typeof v.text !== "string" || v.text.trim() === "") {
    errors.push(`${path}.text is required and must be a non-empty string.`);
  }
}

function validateEncounterSpec(
  v: unknown,
  path: string,
  errors: string[],
): void {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (typeof v.name !== "string" || v.name.trim() === "") {
    errors.push(`${path}.name is required and must be a non-empty string.`);
  }
  if (v.blocks !== undefined) {
    if (!Array.isArray(v.blocks)) {
      errors.push(`${path}.blocks must be an array.`);
    } else {
      v.blocks.forEach((b, i) =>
        validateBlockSpec(b, `${path}.blocks[${i}]`, errors),
      );
    }
  }
  if (v.combatants !== undefined) {
    if (!Array.isArray(v.combatants)) {
      errors.push(`${path}.combatants must be an array.`);
    } else {
      v.combatants.forEach((c, i) =>
        validateCombatantSpec(c, `${path}.combatants[${i}]`, errors),
      );
    }
  }
}

function validateRoster(
  v: unknown,
  path: string,
  errors: string[],
): void {
  if (v === undefined) return;
  if (!Array.isArray(v)) {
    errors.push(`${path} must be an array.`);
    return;
  }
  v.forEach((c, i) =>
    validateCharacterSpec(c, `${path}[${i}]`, errors, { requireType: true }),
  );
}

function validateSessionSpec(
  v: unknown,
  path: string,
  errors: string[],
): void {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (typeof v.name !== "string" || v.name.trim() === "") {
    errors.push(`${path}.name is required and must be a non-empty string.`);
  }
  validateRoster(v.roster, `${path}.roster`, errors);
  if (v.notes !== undefined) {
    if (!Array.isArray(v.notes)) {
      errors.push(`${path}.notes must be an array.`);
    } else {
      v.notes.forEach((n, i) =>
        validateBlockSpec(n, `${path}.notes[${i}]`, errors),
      );
    }
  }
  if (v.encounters !== undefined) {
    if (!Array.isArray(v.encounters)) {
      errors.push(`${path}.encounters must be an array.`);
    } else {
      v.encounters.forEach((e, i) =>
        validateEncounterSpec(e, `${path}.encounters[${i}]`, errors),
      );
    }
  }
}

function validateCampaignSpec(
  v: unknown,
  path: string,
  errors: string[],
): void {
  if (!isObject(v)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (typeof v.name !== "string" || v.name.trim() === "") {
    errors.push(`${path}.name is required and must be a non-empty string.`);
  }
  validateRoster(v.roster, `${path}.roster`, errors);
  if (v.sessions !== undefined) {
    if (!Array.isArray(v.sessions)) {
      errors.push(`${path}.sessions must be an array.`);
    } else {
      v.sessions.forEach((sess, i) =>
        validateSessionSpec(sess, `${path}.sessions[${i}]`, errors),
      );
    }
  }
}

/**
 * Parse and structurally validate an import file. Resolvability of combatant
 * names against a specific campaign roster is checked later, at import time.
 */
export function parseImport(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return {
      ok: false,
      errors: [`File is not valid JSON: ${(e as Error).message}`],
    };
  }

  if (!isObject(data)) {
    return { ok: false, errors: ["Top level of the file must be an object."] };
  }

  const errors: string[] = [];

  if (
    data.formatVersion !== undefined &&
    data.formatVersion !== FORMAT_VERSION
  ) {
    errors.push(
      `Unsupported formatVersion ${String(data.formatVersion)} (this app expects ${FORMAT_VERSION}).`,
    );
  }

  const kind = data.kind;
  switch (kind) {
    case "character":
      validateCharacterSpec(data.character, "character", errors, {
        requireType: true,
      });
      break;
    case "encounter":
      validateEncounterSpec(data.encounter, "encounter", errors);
      break;
    case "session":
      validateSessionSpec(data.session, "session", errors);
      break;
    case "campaign":
      validateCampaignSpec(data.campaign, "campaign", errors);
      break;
    default:
      errors.push(
        `"kind" must be one of: character, encounter, session, campaign.`,
      );
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, file: data as unknown as AnyFile };
}
