import { useEffect, useState } from "react";
import type { Character, EncounterStatus, TurnEntry } from "../types";
import { CHARACTER_TYPE_LABELS } from "../constants";
import { useStore } from "../store";
import { formatCombatStatLine } from "../combatStats";

export default function CombatantRow({
  entry,
  character,
  encounterId,
  isCurrentTurn,
  phase,
  actingCharacterName,
}: {
  entry: TurnEntry;
  character: Character;
  encounterId: string;
  isCurrentTurn: boolean;
  phase: EncounterStatus;
  /** Whoever's turn it currently is, used to prefill "By" on HP actions. */
  actingCharacterName?: string;
}) {
  const applyDamage = useStore((s) => s.applyDamage);
  const applyHeal = useStore((s) => s.applyHeal);
  const grantTempHp = useStore((s) => s.grantTempHp);
  const clearTempHp = useStore((s) => s.clearTempHp);
  const removeParticipant = useStore((s) => s.removeParticipant);
  const setInitiative = useStore((s) => s.setInitiative);
  const promoteCharacter = useStore((s) => s.promoteCharacter);

  const [damage, setDamage] = useState("");
  const [heal, setHeal] = useState("");
  const [temp, setTemp] = useState("");
  const [source, setSource] = useState(actingCharacterName ?? "");

  // Keep "By" pointed at whoever's turn it is as the fight progresses,
  // unless the DM has typed something else in for this row.
  useEffect(() => {
    setSource(actingCharacterName ?? "");
  }, [actingCharacterName]);

  const showInitiative = phase !== "create";
  const editableInitiative = phase === "prep" || phase === "run";
  const showHpControls = phase === "run";
  const showActions = phase !== "closed";

  const hpRatio = character.maxHp > 0 ? character.currentHp / character.maxHp : 0;
  const isDown = character.currentHp <= 0;
  const statLine = character.type !== "pc" ? formatCombatStatLine(character) : null;
  const hpClass = isDown
    ? "hp-critical"
    : hpRatio > 0.5
      ? "hp-healthy"
      : hpRatio > 0.25
        ? "hp-wounded"
        : "hp-critical";

  return (
    <li className={`card combatant-row${isCurrentTurn ? " current-turn" : ""}${isDown ? " down" : ""}`}>
      <div className="row space-between">
        <div>
          {showInitiative &&
            (editableInitiative ? (
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
            ))}
          <span className="card-title">{character.name}</span>
          <span className={`badge type-${character.type}`}>
            {CHARACTER_TYPE_LABELS[character.type]}
          </span>
          {character.isTemporary && <span className="badge">scene only</span>}
          {character.ac !== null && <span className="badge">AC {character.ac}</span>}
        </div>
        {showActions && (
          <div className="row">
            {character.isTemporary && (
              <button
                type="button"
                className="ghost small"
                title="Keep this combatant in the campaign roster to reuse later"
                onClick={() => promoteCharacter(character.id)}
              >
                Promote to roster
              </button>
            )}
            <button
              type="button"
              className="danger small"
              onClick={() => removeParticipant(encounterId, character.id)}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="hp-bar-track">
        <div
          className={`hp-bar-fill ${hpClass}`}
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

      {statLine && (
        <div className="row stats combat-stat-line">
          <span>⚔ {statLine}</span>
        </div>
      )}
      {character.type !== "pc" && character.abilities && (
        <p className="abilities-text">{character.abilities}</p>
      )}

      {showHpControls && (
        <div className="row wrap hp-controls">
          <label className="source-field" title="Who dealt/granted this — shown in the log">
            <span className="source-field-label">By</span>
            <input
              type="text"
              placeholder="optional"
              className="source-input"
              autoComplete="off"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
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
              applyDamage(encounterId, character.id, Number(damage) || 0, source);
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
              applyHeal(encounterId, character.id, Number(heal) || 0, source);
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
              grantTempHp(encounterId, character.id, Number(temp) || 0, source);
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
      )}
    </li>
  );
}
