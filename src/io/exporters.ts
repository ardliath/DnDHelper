import type { Character, Encounter, NoteBlock, Session } from "../types";
import {
  FORMAT_VERSION,
  type BlockSpec,
  type CampaignFile,
  type CharacterFile,
  type CharacterSpec,
  type CombatantSpec,
  type EncounterFile,
  type EncounterSpec,
  type SessionFile,
} from "./formats";

function notesToSpec(notes: NoteBlock[]): BlockSpec[] | undefined {
  if (notes.length === 0) return undefined;
  return notes.map((n) => ({ kind: n.kind, text: n.text }));
}

/** Quick-reference combat stats — shared shape between CharacterSpec and CombatantSpec. */
function addCombatStats(
  spec: { attacks?: number; toHit?: string; damage?: string; abilities?: string },
  c: Character,
): void {
  if (c.attacks !== null) spec.attacks = c.attacks;
  if (c.toHit) spec.toHit = c.toHit;
  if (c.damage) spec.damage = c.damage;
  if (c.abilities) spec.abilities = c.abilities;
}

function characterToSpec(c: Character): CharacterSpec {
  const spec: CharacterSpec = {
    name: c.name,
    type: c.type,
    maxHp: c.maxHp,
  };
  if (c.ac !== null) spec.ac = c.ac;
  if (c.notes) spec.notes = c.notes;
  if (c.type === "rival" && c.mood) spec.mood = c.mood;
  if (c.avatar) spec.avatar = c.avatar;
  addCombatStats(spec, c);
  return spec;
}

function combatantToSpec(c: Character, initiative: number): CombatantSpec {
  // Roster characters are referenced by name only; temporary (one-off)
  // combatants carry a full inline stat block so they can be recreated.
  const spec: CombatantSpec = { name: c.name, initiative };
  if (c.isTemporary) {
    spec.type = c.type;
    spec.maxHp = c.maxHp;
    if (c.ac !== null) spec.ac = c.ac;
    if (c.notes) spec.notes = c.notes;
    addCombatStats(spec, c);
  }
  return spec;
}

function encounterToSpec(
  encounter: Encounter,
  charactersById: Map<string, Character>,
): EncounterSpec {
  const combatants: CombatantSpec[] = [];
  for (const entry of encounter.turnOrder) {
    const character = charactersById.get(entry.characterId);
    if (!character) continue;
    combatants.push(combatantToSpec(character, entry.initiative));
  }
  const spec: EncounterSpec = { name: encounter.name };
  if (encounter.blocks.length > 0) {
    spec.blocks = encounter.blocks.map((b) => ({ kind: b.kind, text: b.text }));
  }
  spec.combatants = combatants;
  return spec;
}

/** Non-temporary roster characters referenced by an encounter's turn order. */
function referencedRoster(
  encounters: Encounter[],
  charactersById: Map<string, Character>,
): CharacterSpec[] {
  const seen = new Set<string>();
  const roster: CharacterSpec[] = [];
  for (const enc of encounters) {
    for (const entry of enc.turnOrder) {
      const c = charactersById.get(entry.characterId);
      if (!c || c.isTemporary || seen.has(c.id)) continue;
      seen.add(c.id);
      roster.push(characterToSpec(c));
    }
  }
  return roster;
}

export function characterToFile(c: Character): CharacterFile {
  return {
    formatVersion: FORMAT_VERSION,
    kind: "character",
    character: characterToSpec(c),
  };
}

export function encounterToFile(
  encounter: Encounter,
  charactersById: Map<string, Character>,
): EncounterFile {
  return {
    formatVersion: FORMAT_VERSION,
    kind: "encounter",
    encounter: encounterToSpec(encounter, charactersById),
  };
}

export function sessionToFile(
  session: Session,
  encounters: Encounter[],
  charactersById: Map<string, Character>,
): SessionFile {
  return {
    formatVersion: FORMAT_VERSION,
    kind: "session",
    session: {
      name: session.name,
      roster: referencedRoster(encounters, charactersById),
      notes: notesToSpec(session.notes),
      encounters: encounters.map((e) => encounterToSpec(e, charactersById)),
    },
  };
}

export function campaignToFile(
  campaignName: string,
  roster: Character[],
  sessions: Session[],
  encountersBySession: Map<string, Encounter[]>,
  charactersById: Map<string, Character>,
): CampaignFile {
  return {
    formatVersion: FORMAT_VERSION,
    kind: "campaign",
    campaign: {
      name: campaignName,
      roster: roster.map(characterToSpec),
      sessions: sessions.map((sess) => {
        const encounters = encountersBySession.get(sess.id) ?? [];
        return {
          name: sess.name,
          notes: notesToSpec(sess.notes),
          encounters: encounters.map((e) => encounterToSpec(e, charactersById)),
        };
      }),
    },
  };
}
