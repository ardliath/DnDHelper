import { useState } from "react";
import type { CharacterType } from "../types";
import { CHARACTER_TYPE_LABELS, CHARACTER_TYPE_ORDER } from "../constants";
import { useStore } from "../store";
import CombatStatsFields from "./CombatStatsFields";

export default function AddCharacterForm({ campaignId }: { campaignId: string }) {
  const addCharacter = useStore((s) => s.addCharacter);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CharacterType>("pc");
  const [maxHp, setMaxHp] = useState("10");
  const [ac, setAc] = useState("");
  const [showCombatStats, setShowCombatStats] = useState(false);
  const [attacks, setAttacks] = useState("");
  const [toHit, setToHit] = useState("");
  const [damage, setDamage] = useState("");
  const [abilities, setAbilities] = useState("");

  function reset() {
    setName("");
    setMaxHp("10");
    setAc("");
    setShowCombatStats(false);
    setAttacks("");
    setToHit("");
    setDamage("");
    setAbilities("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addCharacter(campaignId, {
      type,
      name: trimmed,
      maxHp: Math.max(1, Number(maxHp) || 1),
      ac: ac.trim() === "" ? null : Number(ac),
      ...(type !== "pc" && {
        attacks: attacks.trim() === "" ? null : Number(attacks),
        toHit,
        damage,
        abilities,
      }),
    });
    reset();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        + Add character
      </button>
    );
  }

  return (
    <form className="card add-character-form" onSubmit={handleSubmit}>
      <div className="row wrap">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <select value={type} onChange={(e) => setType(e.target.value as CharacterType)}>
          {CHARACTER_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {CHARACTER_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Max HP"
          value={maxHp}
          onChange={(e) => setMaxHp(e.target.value)}
        />
        <input
          type="number"
          placeholder="AC"
          value={ac}
          onChange={(e) => setAc(e.target.value)}
        />
      </div>

      {type !== "pc" && (
        <>
          <button
            type="button"
            className="ghost small"
            onClick={() => setShowCombatStats((v) => !v)}
          >
            {showCombatStats ? "Hide combat stats" : "+ Combat stats"}
          </button>
          {showCombatStats && (
            <CombatStatsFields
              attacks={attacks}
              setAttacks={setAttacks}
              toHit={toHit}
              setToHit={setToHit}
              damage={damage}
              setDamage={setDamage}
              abilities={abilities}
              setAbilities={setAbilities}
            />
          )}
        </>
      )}

      <div className="row">
        <button type="submit">Add</button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
