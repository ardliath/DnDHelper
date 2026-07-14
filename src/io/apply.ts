import type {
  Campaign,
  Character,
  Encounter,
  Session,
} from "../types";
import type {
  CampaignSpec,
  CharacterSpec,
  CombatantSpec,
  EncounterSpec,
  SessionSpec,
} from "./formats";

function id(): string {
  return crypto.randomUUID();
}
function now(): string {
  return new Date().toISOString();
}
function norm(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * The new entities an import will append to the store, plus a human-readable
 * summary and any blocking errors. Imports are purely additive: existing
 * records are referenced, never modified or removed.
 */
export interface ImportPlan {
  campaigns: Campaign[];
  sessions: Session[];
  characters: Character[];
  encounters: Encounter[];
  summary: string;
  errors: string[];
}

function emptyPlan(): ImportPlan {
  return {
    campaigns: [],
    sessions: [],
    characters: [],
    encounters: [],
    summary: "",
    errors: [],
  };
}

/** A plan that does nothing but report a single error. */
export function noPlan(error: string): ImportPlan {
  return { ...emptyPlan(), errors: [error] };
}

function makeRosterCharacter(
  campaignId: string,
  spec: CharacterSpec,
): Character {
  return {
    id: id(),
    campaignId,
    type: spec.type,
    name: spec.name,
    maxHp: spec.maxHp,
    currentHp: spec.maxHp,
    tempHp: 0,
    ac: spec.ac ?? null,
    notes: spec.notes ?? "",
    isTemporary: false,
    mood: spec.type === "rival" ? (spec.mood ?? "neutral") : null,
    moodHistory: [],
  };
}

function makeTempCombatant(
  campaignId: string,
  spec: CombatantSpec,
): Character {
  return {
    id: id(),
    campaignId,
    type: spec.type ?? "monster",
    name: spec.name,
    maxHp: spec.maxHp as number,
    currentHp: spec.maxHp as number,
    tempHp: 0,
    ac: spec.ac ?? null,
    notes: spec.notes ?? "",
    isTemporary: true,
    mood: null,
    moodHistory: [],
  };
}

/**
 * Resolve one encounter spec into an Encounter plus any per-encounter
 * combatants it introduces. `rosterByName` is mutated only by callers that
 * add shared roster characters; temporary combatants are never added to it.
 */
function buildEncounter(
  campaignId: string,
  sessionId: string,
  spec: EncounterSpec,
  rosterByName: Map<string, Character>,
  newCharacters: Character[],
  errors: string[],
): Encounter {
  const encounter: Encounter = {
    id: id(),
    sessionId,
    name: spec.name,
    status: "setup",
    round: 1,
    currentTurnIndex: 0,
    turnOrder: [],
    createdAt: now(),
  };
  for (const [i, cb] of (spec.combatants ?? []).entries()) {
    const existing = rosterByName.get(norm(cb.name));
    if (existing) {
      encounter.turnOrder.push({
        characterId: existing.id,
        initiative: cb.initiative ?? 0,
      });
    } else if (typeof cb.maxHp === "number") {
      const temp = makeTempCombatant(campaignId, cb);
      newCharacters.push(temp);
      encounter.turnOrder.push({
        characterId: temp.id,
        initiative: cb.initiative ?? 0,
      });
    } else {
      errors.push(
        `Encounter "${spec.name}", combatant #${i + 1} ("${cb.name}") is not in the roster and has no stat block (needs at least maxHp).`,
      );
    }
  }
  return encounter;
}

function rosterMap(roster: Character[]): Map<string, Character> {
  const map = new Map<string, Character>();
  for (const c of roster) {
    if (!c.isTemporary) map.set(norm(c.name), c);
  }
  return map;
}

/** Ensure each roster spec exists; create the ones that don't. */
function ensureRoster(
  campaignId: string,
  specs: CharacterSpec[] | undefined,
  rosterByName: Map<string, Character>,
  newCharacters: Character[],
): number {
  let added = 0;
  for (const spec of specs ?? []) {
    if (rosterByName.has(norm(spec.name))) continue;
    const c = makeRosterCharacter(campaignId, spec);
    rosterByName.set(norm(c.name), c);
    newCharacters.push(c);
    added += 1;
  }
  return added;
}

export function planCharacterImport(
  existingRoster: Character[],
  campaignId: string,
  spec: CharacterSpec,
): ImportPlan {
  const plan = emptyPlan();
  const map = rosterMap(existingRoster);
  if (map.has(norm(spec.name))) {
    plan.summary = `"${spec.name}" is already in the roster — nothing to add.`;
    return plan;
  }
  const c = makeRosterCharacter(campaignId, spec);
  plan.characters.push(c);
  plan.summary = `Added "${spec.name}" to the roster.`;
  return plan;
}

export function planEncounterImport(
  existingRoster: Character[],
  campaignId: string,
  sessionId: string,
  spec: EncounterSpec,
): ImportPlan {
  const plan = emptyPlan();
  const map = rosterMap(existingRoster);
  const encounter = buildEncounter(
    campaignId,
    sessionId,
    spec,
    map,
    plan.characters,
    plan.errors,
  );
  if (plan.errors.length > 0) return plan;
  plan.encounters.push(encounter);
  const newCount = plan.characters.length;
  plan.summary = `Imported encounter "${spec.name}" (${encounter.turnOrder.length} combatant${encounter.turnOrder.length === 1 ? "" : "s"}${newCount > 0 ? `, ${newCount} new` : ""}).`;
  return plan;
}

export function planSessionImport(
  existingRoster: Character[],
  campaignId: string,
  spec: SessionSpec,
): ImportPlan {
  const plan = emptyPlan();
  const map = rosterMap(existingRoster);
  const rosterAdded = ensureRoster(
    campaignId,
    spec.roster,
    map,
    plan.characters,
  );

  const session: Session = {
    id: id(),
    campaignId,
    name: spec.name,
    createdAt: now(),
  };
  for (const encSpec of spec.encounters ?? []) {
    const encounter = buildEncounter(
      campaignId,
      session.id,
      encSpec,
      map,
      plan.characters,
      plan.errors,
    );
    plan.encounters.push(encounter);
  }
  if (plan.errors.length > 0) return plan;

  plan.sessions.push(session);
  const encCount = plan.encounters.length;
  plan.summary = `Imported session "${spec.name}" with ${encCount} encounter${encCount === 1 ? "" : "s"}${rosterAdded > 0 ? `, ${rosterAdded} new roster character${rosterAdded === 1 ? "" : "s"}` : ""}.`;
  return plan;
}

export function planCampaignImport(spec: CampaignSpec): ImportPlan {
  const plan = emptyPlan();
  const campaign: Campaign = {
    id: id(),
    name: spec.name,
    createdAt: now(),
  };
  const map = new Map<string, Character>();
  ensureRoster(campaign.id, spec.roster, map, plan.characters);

  for (const sessSpec of spec.sessions ?? []) {
    const session: Session = {
      id: id(),
      campaignId: campaign.id,
      name: sessSpec.name,
      createdAt: now(),
    };
    // A campaign's session may also declare its own roster additions.
    ensureRoster(campaign.id, sessSpec.roster, map, plan.characters);
    for (const encSpec of sessSpec.encounters ?? []) {
      const encounter = buildEncounter(
        campaign.id,
        session.id,
        encSpec,
        map,
        plan.characters,
        plan.errors,
      );
      plan.encounters.push(encounter);
    }
    plan.sessions.push(session);
  }
  if (plan.errors.length > 0) return plan;

  plan.campaigns.push(campaign);
  plan.summary = `Imported campaign "${spec.name}" (${plan.sessions.length} session${plan.sessions.length === 1 ? "" : "s"}, ${plan.encounters.length} encounter${plan.encounters.length === 1 ? "" : "s"}).`;
  return plan;
}
