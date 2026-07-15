import { useState } from "react";
import { useStore } from "../store";
import CombatStatsFields from "./CombatStatsFields";

export default function AddOneOffForm({
  encounterId,
  campaignId,
  showInitiative = true,
}: {
  encounterId: string;
  campaignId: string;
  showInitiative?: boolean;
}) {
  const addOneOffCombatant = useStore((s) => s.addOneOffCombatant);
  const [name, setName] = useState("");
  const [maxHp, setMaxHp] = useState("10");
  const [ac, setAc] = useState("");
  const [initiative, setInitiative] = useState("");
  const [showCombatStats, setShowCombatStats] = useState(false);
  const [attacks, setAttacks] = useState("");
  const [toHit, setToHit] = useState("");
  const [damage, setDamage] = useState("");
  const [abilities, setAbilities] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addOneOffCombatant(encounterId, campaignId, {
      name: trimmed,
      maxHp: Math.max(1, Number(maxHp) || 1),
      ac: ac.trim() === "" ? null : Number(ac),
      initiative: showInitiative ? Number(initiative) || 0 : 0,
      attacks: attacks.trim() === "" ? null : Number(attacks),
      toHit,
      damage,
      abilities,
    });
    setName("");
    setMaxHp("10");
    setAc("");
    setInitiative("");
    setShowCombatStats(false);
    setAttacks("");
    setToHit("");
    setDamage("");
    setAbilities("");
  }

  return (
    <form className="card add-character-form" onSubmit={handleSubmit}>
      <div className="row wrap">
        <input
          type="text"
          placeholder="Name (one-off, not saved to roster)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        {showInitiative && (
          <input
            type="number"
            placeholder="Initiative"
            className="initiative-input"
            value={initiative}
            onChange={(e) => setInitiative(e.target.value)}
          />
        )}
      </div>

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

      <div className="row">
        <button type="submit">Add</button>
      </div>
    </form>
  );
}
