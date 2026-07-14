import { useState } from "react";
import type { Character, TurnEntry } from "../types";
import { CHARACTER_TYPE_LABELS } from "../constants";
import { useStore } from "../store";

export default function CombatantRow({
  entry,
  character,
  encounterId,
  isCurrentTurn,
  editableInitiative,
}: {
  entry: TurnEntry;
  character: Character;
  encounterId: string;
  isCurrentTurn: boolean;
  editableInitiative: boolean;
}) {
  const applyDamage = useStore((s) => s.applyDamage);
  const applyHeal = useStore((s) => s.applyHeal);
  const grantTempHp = useStore((s) => s.grantTempHp);
  const clearTempHp = useStore((s) => s.clearTempHp);
  const removeParticipant = useStore((s) => s.removeParticipant);
  const setInitiative = useStore((s) => s.setInitiative);

  const [damage, setDamage] = useState("");
  const [heal, setHeal] = useState("");
  const [temp, setTemp] = useState("");

  const hpRatio = character.maxHp > 0 ? character.currentHp / character.maxHp : 0;
  const isDown = character.currentHp <= 0;

  return (
    <li className={`card combatant-row${isCurrentTurn ? " current-turn" : ""}${isDown ? " down" : ""}`}>
      <div className="row space-between">
        <div>
          {editableInitiative ? (
            <input
              type="number"
              className="initiative-input"
              value={entry.initiative}
              onChange={(e) =>
                setInitiative(encounterId, character.id, Number(e.target.value) || 0)
              }
              title="Initiative"
            />
          ) : (
            <span className="initiative-badge">{entry.initiative}</span>
          )}
          <span className="card-title">{character.name}</span>
          <span className="badge">{CHARACTER_TYPE_LABELS[character.type]}</span>
          {character.ac !== null && <span className="badge">AC {character.ac}</span>}
        </div>
        <button
          type="button"
          className="danger small"
          onClick={() => removeParticipant(encounterId, character.id)}
        >
          Remove
        </button>
      </div>

      <div className="hp-bar-track">
        <div
          className="hp-bar-fill"
          style={{ width: `${Math.max(0, Math.min(1, hpRatio)) * 100}%` }}
        />
      </div>
      <div className="row stats">
        <span>
          HP: {character.currentHp}/{character.maxHp}
          {character.tempHp > 0 ? ` (+${character.tempHp} temp)` : ""}
          {isDown ? " — Down" : ""}
        </span>
      </div>

      <div className="row wrap hp-controls">
        <input
          type="number"
          placeholder="Damage"
          value={damage}
          onChange={(e) => setDamage(e.target.value)}
        />
        <button
          type="button"
          className="danger small"
          onClick={() => {
            applyDamage(character.id, Number(damage) || 0);
            setDamage("");
          }}
        >
          Apply damage
        </button>

        <input
          type="number"
          placeholder="Heal"
          value={heal}
          onChange={(e) => setHeal(e.target.value)}
        />
        <button
          type="button"
          className="small"
          onClick={() => {
            applyHeal(character.id, Number(heal) || 0);
            setHeal("");
          }}
        >
          Apply heal
        </button>

        <input
          type="number"
          placeholder="Temp HP"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
        />
        <button
          type="button"
          className="small"
          onClick={() => {
            grantTempHp(character.id, Number(temp) || 0);
            setTemp("");
          }}
        >
          Grant temp HP
        </button>
        {character.tempHp > 0 && (
          <button type="button" className="ghost small" onClick={() => clearTempHp(character.id)}>
            Clear temp HP
          </button>
        )}
      </div>
    </li>
  );
}
