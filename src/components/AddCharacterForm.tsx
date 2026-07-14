import { useState } from "react";
import type { CharacterType } from "../types";
import { CHARACTER_TYPE_LABELS, CHARACTER_TYPE_ORDER } from "../constants";
import { useStore } from "../store";

export default function AddCharacterForm({ campaignId }: { campaignId: string }) {
  const addCharacter = useStore((s) => s.addCharacter);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CharacterType>("pc");
  const [maxHp, setMaxHp] = useState("10");
  const [ac, setAc] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addCharacter(campaignId, {
      type,
      name: trimmed,
      maxHp: Math.max(1, Number(maxHp) || 1),
      ac: ac.trim() === "" ? null : Number(ac),
    });
    setName("");
    setMaxHp("10");
    setAc("");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        + Add character
      </button>
    );
  }

  return (
    <form className="row wrap card" onSubmit={handleSubmit}>
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
      <button type="submit">Add</button>
      <button type="button" className="ghost" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}
