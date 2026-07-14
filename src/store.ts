import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Campaign,
  Character,
  CharacterType,
  Encounter,
  MoodLabel,
} from "./types";

function id(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
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
  characters: Character[];
  encounters: Encounter[];

  // Campaigns
  addCampaign: (name: string) => Campaign;
  renameCampaign: (campaignId: string, name: string) => void;
  deleteCampaign: (campaignId: string) => void;

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
  applyDamage: (characterId: string, amount: number) => void;
  applyHeal: (characterId: string, amount: number) => void;
  grantTempHp: (characterId: string, amount: number) => void;
  clearTempHp: (characterId: string) => void;
  setMood: (characterId: string, label: MoodLabel, note: string) => void;

  // Encounters
  addEncounter: (campaignId: string, name: string) => Encounter;
  deleteEncounter: (encounterId: string) => void;
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
  startEncounter: (encounterId: string) => void;
  nextTurn: (encounterId: string) => void;
  prevTurn: (encounterId: string) => void;
  endEncounter: (encounterId: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      campaigns: [],
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
        const encounterIds = get()
          .encounters.filter((e) => e.campaignId === campaignId)
          .map((e) => e.id);
        set((s) => ({
          campaigns: s.campaigns.filter((c) => c.id !== campaignId),
          characters: s.characters.filter((c) => c.campaignId !== campaignId),
          encounters: s.encounters.filter(
            (e) => !encounterIds.includes(e.id),
          ),
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

      applyDamage: (characterId, amount) => {
        if (amount <= 0) return;
        set((s) => ({
          characters: s.characters.map((c) => {
            if (c.id !== characterId) return c;
            let remaining = amount;
            const tempHp = Math.max(0, c.tempHp - remaining);
            remaining = Math.max(0, remaining - c.tempHp);
            const currentHp = Math.max(0, c.currentHp - remaining);
            return { ...c, tempHp, currentHp };
          }),
        }));
      },

      applyHeal: (characterId, amount) => {
        if (amount <= 0) return;
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId
              ? { ...c, currentHp: Math.min(c.maxHp, c.currentHp + amount) }
              : c,
          ),
        }));
      },

      grantTempHp: (characterId, amount) => {
        if (amount <= 0) return;
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId
              ? { ...c, tempHp: Math.max(c.tempHp, amount) }
              : c,
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

      addEncounter: (campaignId, name) => {
        const encounter: Encounter = {
          id: id(),
          campaignId,
          name,
          status: "setup",
          round: 1,
          currentTurnIndex: 0,
          turnOrder: [],
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

      startEncounter: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  status: "active",
                  round: 1,
                  currentTurnIndex: 0,
                  turnOrder: [...e.turnOrder].sort(
                    (a, b) => b.initiative - a.initiative,
                  ),
                }
              : e,
          ),
        }));
      },

      nextTurn: (encounterId) => {
        set((s) => ({
          encounters: s.encounters.map((e) => {
            if (e.id !== encounterId || e.turnOrder.length === 0) return e;
            const atEnd = e.currentTurnIndex >= e.turnOrder.length - 1;
            return atEnd
              ? { ...e, currentTurnIndex: 0, round: e.round + 1 }
              : { ...e, currentTurnIndex: e.currentTurnIndex + 1 };
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
            e.id === encounterId ? { ...e, status: "completed" } : e,
          ),
        }));
      },
    }),
    { name: "dnd-helper-storage" },
  ),
);
