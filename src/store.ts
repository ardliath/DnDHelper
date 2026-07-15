import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Campaign,
  Character,
  CharacterType,
  Encounter,
  EncounterEvent,
  EncounterEventKind,
  EncounterStatus,
  MoodLabel,
  NoteKind,
  Session,
} from "./types";
import type { ImportPlan } from "./io/apply";

function id(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

/** Append a logged event to an encounter, stamped with its current round. */
function appendEvent(
  e: Encounter,
  kind: EncounterEventKind,
  text: string,
): Encounter {
  return {
    ...e,
    events: [...e.events, { id: id(), timestamp: now(), round: e.round, kind, text }],
  };
}

/**
 * Remove a combatant from an encounter's turn order, keeping currentTurnIndex
 * pointed at the same combatant (or the next one, if the current combatant is
 * the one being removed).
 */
function removeFromTurnOrder(e: Encounter, characterId: string): Encounter {
  const index = e.turnOrder.findIndex((t) => t.characterId === characterId);
  if (index === -1) return e;

  const turnOrder = e.turnOrder.filter((t) => t.characterId !== characterId);
  let currentTurnIndex = e.currentTurnIndex;
  if (index < currentTurnIndex) currentTurnIndex -= 1;
  if (turnOrder.length === 0) {
    currentTurnIndex = 0;
  } else if (currentTurnIndex > turnOrder.length - 1) {
    currentTurnIndex = turnOrder.length - 1;
  }
  return { ...e, turnOrder, currentTurnIndex };
}

interface State {
  campaigns: Campaign[];
  sessions: Session[];
  characters: Character[];
  encounters: Encounter[];

  // Campaigns
  addCampaign: (name: string) => Campaign;
  renameCampaign: (campaignId: string, name: string) => void;
  deleteCampaign: (campaignId: string) => void;

  // Sessions
  addSession: (campaignId: string, name: string) => Session;
  renameSession: (sessionId: string, name: string) => void;
  deleteSession: (sessionId: string) => void;

  // Session journal (freeform notes, not tied to any encounter)
  addSessionNote: (sessionId: string, kind: NoteKind, text: string) => void;
  updateSessionNote: (
    sessionId: string,
    noteId: string,
    data: { kind?: NoteKind; text?: string },
  ) => void;
  removeSessionNote: (sessionId: string, noteId: string) => void;
  moveSessionNote: (
    sessionId: string,
    noteId: string,
    direction: "up" | "down",
  ) => void;

  // Characters (roster)
  addCharacter: (
    campaignId: string,
    data: {
      type: CharacterType;
      name: string;
      maxHp: number;
      ac: number | null;
      notes?: string;
      isTemporary?: boolean;
    },
  ) => Character;
  updateCharacter: (
    characterId: string,
    data: Partial<Pick<Character, "name" | "type" | "maxHp" | "ac" | "notes">>,
  ) => void;
  deleteCharacter: (characterId: string) => void;
  applyDamage: (
    encounterId: string,
    characterId: string,
    amount: number,
    source?: string,
  ) => void;
  applyHeal: (
    encounterId: string,
    characterId: string,
    amount: number,
    source?: string,
  ) => void;
  grantTempHp: (
    encounterId: string,
    characterId: string,
    amount: number,
    source?: string,
  ) => void;
  clearTempHp: (characterId: string) => void;
  setMood: (characterId: string, label: MoodLabel, note: string) => void;
  /** Turn a one-off (temporary) combatant into a permanent roster character. */
  promoteCharacter: (characterId: string) => void;

  // Encounters
  addEncounter: (sessionId: string, name: string) => Encounter;
  deleteEncounter: (encounterId: string) => void;
  moveEncounter: (
    sessionId: string,
    encounterId: string,
    direction: "up" | "down",
  ) => void;
  addParticipant: (
    encounterId: string,
    characterId: string,
    initiative: number,
  ) => void;
  addOneOffCombatant: (
    encounterId: string,
    campaignId: string,
    data: { name: string; maxHp: number; ac: number | null; initiative: number },
  ) => void;
  removeParticipant: (encounterId: string, characterId: string) => void;
  setInitiative: (
    encounterId: string,
    characterId: string,
    initiative: number,
  ) => void;
  /** create -> prep */
  advanceToPrep: (encounterId: string) => void;
  /** prep -> run */
  startEncounter: (encounterId: string) => void;
  nextTurn: (encounterId: string) => void;
  prevTurn: (encounterId: string) => void;
  /** run -> closed */
  endEncounter: (encounterId: string) => void;
  /** closed -> run */
  reopenEncounter: (encounterId: string) => void;

  // Encounter scene blocks
  addEncounterBlock: (
    encounterId: string,
    kind: NoteKind,
    text: string,
  ) => void;
  updateEncounterBlock: (
    encounterId: string,
    blockId: string,
    data: { kind?: NoteKind; text?: string },
  ) => void;
  removeEncounterBlock: (encounterId: string, blockId: string) => void;
  moveEncounterBlock: (
    encounterId: string,
    blockId: string,
    direction: "up" | "down",
  ) => void;

  // Import
  commitImport: (plan: ImportPlan) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      campaigns: [],
      sessions: [],
      characters: [],
      encounters: [],

      addCampaign: (name) => {
        const campaign: Campaign = { id: id(), name, createdAt: now() };
        set((s) => ({ campaigns: [...s.campaigns, campaign] }));
        return campaign;
      },

      renameCampaign: (campaignId, name) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId ? { ...c, name } : c,
          ),
        }));
      },

      deleteCampaign: (campaignId) => {
        const sessionIds = get()
          .sessions.filter((sess) => sess.campaignId === campaignId)
          .map((sess) => sess.id);
        const encounterIds = get()
          .encounters.filter((e) => sessionIds.includes(e.sessionId))
          .map((e) => e.id);
        set((s) => ({
          campaigns: s.campaigns.filter((c) => c.id !== campaignId),
          sessions: s.sessions.filter((sess) => sess.campaignId !== campaignId),
          characters: s.characters.filter((c) => c.campaignId !== campaignId),
          encounters: s.encounters.filter(
            (e) => !encounterIds.includes(e.id),
          ),
        }));
      },

      addSession: (campaignId, name) => {
        const session: Session = {
          id: id(),
          campaignId,
          name,
          notes: [],
          createdAt: now(),
        };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session;
      },

      renameSession: (sessionId, name) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, name } : sess,
          ),
        }));
      },

      deleteSession: (sessionId) => {
        const encounterIds = get()
          .encounters.filter((e) => e.sessionId === sessionId)
          .map((e) => e.id);
        const tempIds = new Set(
          get()
            .characters.filter((c) => c.isTemporary)
            .map((c) => c.id),
        );
        const orphanedTempIds = get()
          .encounters.filter((e) => encounterIds.includes(e.id))
          .flatMap((e) => e.turnOrder.map((t) => t.characterId))
          .filter((cid) => tempIds.has(cid));
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== sessionId),
          encounters: s.encounters.filter(
            (e) => !encounterIds.includes(e.id),
          ),
          characters: s.characters.filter(
            (c) => !orphanedTempIds.includes(c.id),
          ),
        }));
      },

      addSessionNote: (sessionId, kind, text) => {
        const trimmed = text.trim();
        if (trimmed === "") return;
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  notes: [...sess.notes, { id: id(), kind, text: trimmed }],
                }
              : sess,
          ),
        }));
      },

      updateSessionNote: (sessionId, noteId, data) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  notes: sess.notes.map((n) =>
                    n.id === noteId ? { ...n, ...data } : n,
                  ),
                }
              : sess,
          ),
        }));
      },

      removeSessionNote: (sessionId, noteId) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, notes: sess.notes.filter((n) => n.id !== noteId) }
              : sess,
          ),
        }));
      },

      moveSessionNote: (sessionId, noteId, direction) => {
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const index = sess.notes.findIndex((n) => n.id === noteId);
            if (index === -1) return sess;
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= sess.notes.length) return sess;
            const notes = [...sess.notes];
            [notes[index], notes[target]] = [notes[target], notes[index]];
            return { ...sess, notes };
          }),
        }));
      },

      addCharacter: (campaignId, data) => {
        const character: Character = {
          id: id(),
          campaignId,
          type: data.type,
          name: data.name,
          maxHp: data.maxHp,
          currentHp: data.maxHp,
          tempHp: 0,
          ac: data.ac,
          notes: data.notes ?? "",
          isTemporary: data.isTemporary ?? false,
          mood: data.type === "rival" ? "neutral" : null,
          moodHistory: [],
        };
        set((s) => ({ characters: [...s.characters, character] }));
        return character;
      },

      updateCharacter: (characterId, data) => {
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId
              ? {
                  ...c,
                  ...data,
                  currentHp:
                    data.maxHp !== undefined
                      ? Math.min(c.currentHp, data.maxHp)
                      : c.currentHp,
                }
              : c,
          ),
        }));
      },

      deleteCharacter: (characterId) => {
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== characterId),
          encounters: s.encounters.map((e) =>
            removeFromTurnOrder(e, characterId),
          ),
        }));
      },

      applyDamage: (encounterId, characterId, amount, source) => {
        if (amount <= 0) return;
        const character = get().characters.find((c) => c.id === characterId);
        if (!character) return;
        let remaining = amount;
        const tempHp = Math.max(0, character.tempHp - remaining);
        remaining = Math.max(0, remaining - character.tempHp);
        const currentHp = Math.max(0, character.currentHp - remaining);
        const justDown = currentHp <= 0 && character.currentHp > 0;
        const src = source?.trim();
        const text = src
          ? `${src} dealt ${amount} damage to ${character.name} (${character.currentHp} → ${currentHp} HP)${justDown ? " — down!" : ""}`
          : `${character.name} took ${amount} damage (${character.currentHp} → ${currentHp} HP)${justDown ? " — down!" : ""}`;
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId ? { ...c, tempHp, currentHp } : c,
          ),
          encounters: s.encounters.map((e) =>
            e.id === encounterId ? appendEvent(e, "damage", text) : e,
          ),
        }));
      },

      applyHeal: (encounterId, characterId, amount, source) => {
        if (amount <= 0) return;
        const character = get().characters.find((c) => c.id === characterId);
        if (!character) return;
        const currentHp = Math.min(character.maxHp, character.currentHp + amount);
        const src = source?.trim();
        const text = src
          ? `${src} healed ${character.name} for ${amount} HP (${character.currentHp} → ${currentHp} HP)`
          : `${character.name} healed ${amount} HP (${character.currentHp} → ${currentHp} HP)`;
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId ? { ...c, currentHp } : c,
          ),
          encounters: s.encounters.map((e) =>
            e.id === encounterId ? appendEvent(e, "heal", text) : e,
          ),
        }));
      },

      grantTempHp: (encounterId, characterId, amount, source) => {
        if (amount <= 0) return;
        const character = get().characters.find((c) => c.id === characterId);
        if (!character) return;
        const tempHp = Math.max(character.tempHp, amount);
        const src = source?.trim();
        const text = src
          ? `${src} granted ${character.name} ${amount} temporary HP (now ${tempHp}).`
          : `${character.name} gained ${amount} temporary HP (now ${tempHp}).`;
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId ? { ...c, tempHp } : c,
          ),
          encounters:
            tempHp === character.tempHp
              ? s.encounters
              : s.encounters.map((e) =>
                  e.id === encounterId ? appendEvent(e, "temp-hp", text) : e,
                ),
        }));
      },

      clearTempHp: (characterId) => {
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId ? { ...c, tempHp: 0 } : c,
          ),
        }));
      },

      setMood: (characterId, label, note) => {
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId
              ? {
                  ...c,
                  mood: label,
                  moodHistory: [
                    ...c.moodHistory,
                    { id: id(), timestamp: now(), label, note },
                  ],
                }
              : c,
          ),
        }));
      },

      promoteCharacter: (characterId) => {
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId ? { ...c, isTemporary: false } : c,
          ),
        }));
      },

      addEncounter: (sessionId, name) => {
        const encounter: Encounter = {
          id: id(),
          sessionId,
          name,
          status: "create",
          round: 1,
          currentTurnIndex: 0,
          turnOrder: [],
          blocks: [],
          events: [],
          createdAt: now(),
        };
        set((s) => ({ encounters: [...s.encounters, encounter] }));
        return encounter;
      },

      deleteEncounter: (encounterId) => {
        const encounter = get().encounters.find((e) => e.id === encounterId);
        const tempIds = new Set(
          get()
            .characters.filter((c) => c.isTemporary)
            .map((c) => c.id),
        );
        const orphanedTempIds =
          encounter?.turnOrder
            .map((t) => t.characterId)
            .filter((cid) => tempIds.has(cid)) ?? [];
        set((s) => ({
          encounters: s.encounters.filter((e) => e.id !== encounterId),
          characters: s.characters.filter(
            (c) => !orphanedTempIds.includes(c.id),
          ),
        }));
      },

      moveEncounter: (sessionId, encounterId, direction) => {
        set((s) => {
          // Display order is the encounters' relative order within the
          // global array (filtered per session), so reordering means
          // swapping the two encounters' positions in that array.
          const sessionIndices = s.encounters
            .map((e, i) => (e.sessionId === sessionId ? i : -1))
            .filter((i) => i !== -1);
          const posInSession = sessionIndices.findIndex(
            (i) => s.encounters[i].id === encounterId,
          );
          if (posInSession === -1) return s;
          const targetPos =
            direction === "up" ? posInSession - 1 : posInSession + 1;
          if (targetPos < 0 || targetPos >= sessionIndices.length) return s;
          const indexA = sessionIndices[posInSession];
          const indexB = sessionIndices[targetPos];
          const encounters = [...s.encounters];
          [encounters[indexA], encounters[indexB]] = [
            encounters[indexB],
            encounters[indexA],
          ];
          return { encounters };
        });
      },

      addParticipant: (encounterId, characterId, initiative) => {
        set((s) => ({
          encounters: s.encounters.map((e) => {
            if (e.id !== encounterId) return e;
            if (e.turnOrder.some((t) => t.characterId === characterId)) {
              return e;
            }
            return {
              ...e,
              turnOrder: [...e.turnOrder, { characterId, initiative }],
            };
          }),
        }));
      },

      addOneOffCombatant: (encounterId, campaignId, data) => {
        const character: Character = {
          id: id(),
          campaignId,
          type: "other",
          name: data.name,
          maxHp: data.maxHp,
          currentHp: data.maxHp,
          tempHp: 0,
          ac: data.ac,
          notes: "",
          isTemporary: true,
          mood: null,
          moodHistory: [],
        };
        set((s) => ({
          characters: [...s.characters, character],
          encounters: s.encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  turnOrder: [
                    ...e.turnOrder,
                    { characterId: character.id, initiative: data.initiative },
                  ],
                }
              : e,
          ),
        }));
      },

      removeParticipant: (encounterId, characterId) => {
        set((s) => {
          const encounters = s.encounters.map((e) =>
            e.id === encounterId ? removeFromTurnOrder(e, characterId) : e,
          );
          // Clean up a one-off combatant that is no longer in any encounter.
          const char = s.characters.find((c) => c.id === characterId);
          const stillUsed = encounters.some((e) =>
            e.turnOrder.some((t) => t.characterId === characterId),
          );
          const characters =
            char?.isTemporary && !stillUsed
              ? s.characters.filter((c) => c.id !== characterId)
              : s.characters;
          return { encounters, characters };
        });
      },

      setInitiative: (encounterId, characterId, initiative) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  turnOrder: e.turnOrder.map((t) =>
                    t.characterId === characterId
                      ? { ...t, initiative }
                      : t,
                  ),
                }
              : e,
          ),
        }));
      },

      advanceToPrep: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId && e.status === "create"
              ? { ...e, status: "prep" }
              : e,
          ),
        }));
      },

      startEncounter: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) => {
            if (e.id !== encounterId || e.status !== "prep") return e;
            const started: Encounter = {
              ...e,
              status: "run",
              round: 1,
              currentTurnIndex: 0,
              turnOrder: [...e.turnOrder].sort(
                (a, b) => b.initiative - a.initiative,
              ),
            };
            return appendEvent(started, "round", "Round 1 began.");
          }),
        }));
      },

      nextTurn: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) => {
            if (e.id !== encounterId || e.turnOrder.length === 0) return e;
            const atEnd = e.currentTurnIndex >= e.turnOrder.length - 1;
            if (!atEnd) {
              return { ...e, currentTurnIndex: e.currentTurnIndex + 1 };
            }
            const round = e.round + 1;
            return appendEvent(
              { ...e, currentTurnIndex: 0, round },
              "round",
              `Round ${round} began.`,
            );
          }),
        }));
      },

      prevTurn: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) => {
            if (e.id !== encounterId || e.turnOrder.length === 0) return e;
            const atStart = e.currentTurnIndex <= 0;
            if (!atStart) {
              return { ...e, currentTurnIndex: e.currentTurnIndex - 1 };
            }
            if (e.round <= 1) return e;
            return {
              ...e,
              round: e.round - 1,
              currentTurnIndex: e.turnOrder.length - 1,
            };
          }),
        }));
      },

      endEncounter: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId && e.status === "run"
              ? { ...e, status: "closed" }
              : e,
          ),
        }));
      },

      reopenEncounter: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId && e.status === "closed"
              ? { ...e, status: "run" }
              : e,
          ),
        }));
      },

      addEncounterBlock: (encounterId, kind, text) => {
        const trimmed = text.trim();
        if (trimmed === "") return;
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  blocks: [...e.blocks, { id: id(), kind, text: trimmed }],
                }
              : e,
          ),
        }));
      },

      updateEncounterBlock: (encounterId, blockId, data) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  blocks: e.blocks.map((b) =>
                    b.id === blockId ? { ...b, ...data } : b,
                  ),
                }
              : e,
          ),
        }));
      },

      removeEncounterBlock: (encounterId, blockId) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId
              ? { ...e, blocks: e.blocks.filter((b) => b.id !== blockId) }
              : e,
          ),
        }));
      },

      moveEncounterBlock: (encounterId, blockId, direction) => {
        set((s) => ({
          encounters: s.encounters.map((e) => {
            if (e.id !== encounterId) return e;
            const index = e.blocks.findIndex((b) => b.id === blockId);
            if (index === -1) return e;
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= e.blocks.length) return e;
            const blocks = [...e.blocks];
            [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
            return { ...e, blocks };
          }),
        }));
      },

      commitImport: (plan) => {
        set((s) => ({
          campaigns: [...s.campaigns, ...plan.campaigns],
          sessions: [...s.sessions, ...plan.sessions],
          characters: [...s.characters, ...plan.characters],
          encounters: [...s.encounters, ...plan.encounters],
        }));
      },
    }),
    {
      name: "dnd-helper-storage",
      version: 5,
      migrate: (persistedState, version) => {
        const state = persistedState as {
          campaigns?: Campaign[];
          sessions?: Session[];
          characters?: Character[];
          encounters?: (Encounter & {
            campaignId?: string;
            status: string;
          })[];
        };
        if (version < 2) {
          // Encounters used to belong directly to a campaign. Fold each
          // campaign's pre-existing encounters into a new "Session 1".
          const sessionByCampaign = new Map<string, Session>();
          const encounters = (state.encounters ?? []).map((e) => {
            if (!e.campaignId) return e as Encounter;
            let session = sessionByCampaign.get(e.campaignId);
            if (!session) {
              session = {
                id: id(),
                campaignId: e.campaignId,
                name: "Session 1",
                notes: [],
                createdAt: e.createdAt,
              };
              sessionByCampaign.set(e.campaignId, session);
            }
            const { campaignId: _campaignId, ...rest } = e;
            return { ...rest, sessionId: session.id };
          });
          state.sessions = [
            ...(state.sessions ?? []),
            ...sessionByCampaign.values(),
          ];
          state.encounters = encounters;
        }
        if (version < 3) {
          // Encounters gained scene blocks (read-aloud text / DM notes).
          state.encounters = (state.encounters ?? []).map((e) => ({
            ...e,
            blocks: e.blocks ?? [],
          }));
        }
        if (version < 4) {
          // Encounter status went from 3 phases (setup/active/completed) to 4
          // (create/prep/run/closed), and encounters gained an event log.
          // "setup" is folded into "prep" since it's a strict superset
          // (prep allows everything setup did, plus initiative editing).
          const statusMap: Record<string, EncounterStatus> = {
            setup: "prep",
            active: "run",
            completed: "closed",
          };
          state.encounters = (state.encounters ?? []).map((e) => ({
            ...e,
            status: statusMap[e.status] ?? (e.status as EncounterStatus),
            events: (e.events as EncounterEvent[] | undefined) ?? [],
          }));
        }
        if (version < 5) {
          // Sessions gained their own freeform journal, separate from any
          // one encounter's scene text.
          state.sessions = (state.sessions ?? []).map((sess) => ({
            ...sess,
            notes: sess.notes ?? [],
          }));
        }
        return state;
      },
    },
  ),
);
