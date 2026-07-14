import { useState } from "react";
import { useStore } from "../store";

export default function AddOneOffForm({
  encounterId,
  campaignId,
}: {
  encounterId: string;
  campaignId: string;
}) {
  const addOneOffCombatant = useStore((s) => s.addOneOffCombatant);
  const [name, setName] = useState("");
  const [maxHp, setMaxHp] = useState("10");
  const [ac, setAc] = useState("");
  const [initiative, setInitiative] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addOneOffCombatant(encounterId, campaignId, {
      name: trimmed,
      maxHp: Math.max(1, Number(maxHp) || 1),
      ac: ac.trim() === "" ? null : Number(ac),
      initiative: Number(initiative) || 0,
    });
    setName("");
    setMaxHp("10");
    setAc("");
    setInitiative("");
  }

  return (
    <form className="row wrap card" onSubmit={handleSubmit}>
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
      <input
        type="number"
        placeholder="Initiative"
        className="initiative-input"
        value={initiative}
        onChange={(e) => setInitiative(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
}
