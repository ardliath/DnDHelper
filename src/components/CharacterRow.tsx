import { useState } from "react";
import type { Character } from "../types";
import { CHARACTER_TYPE_LABELS, MOOD_DISPLAY, MOOD_LABELS } from "../constants";
import { useStore } from "../store";
import ExportButton from "./ExportButton";
import CombatStatsFields from "./CombatStatsFields";
import { characterToFile } from "../io/exporters";
import { formatCombatStatLine } from "../combatStats";

export default function CharacterRow({ character }: { character: Character }) {
  const updateCharacter = useStore((s) => s.updateCharacter);
  const deleteCharacter = useStore((s) => s.deleteCharacter);
  const setMood = useStore((s) => s.setMood);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [maxHp, setMaxHp] = useState(String(character.maxHp));
  const [ac, setAc] = useState(character.ac === null ? "" : String(character.ac));
  const [notes, setNotes] = useState(character.notes);
  const [attacks, setAttacks] = useState(
    character.attacks === null ? "" : String(character.attacks),
  );
  const [toHit, setToHit] = useState(character.toHit);
  const [damage, setDamage] = useState(character.damage);
  const [abilities, setAbilities] = useState(character.abilities);

  const [showMoodForm, setShowMoodForm] = useState(false);
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  const [moodLabel, setMoodLabel] = useState(character.mood ?? "neutral");
  const [moodNote, setMoodNote] = useState("");

  const isPc = character.type === "pc";
  const statLine = formatCombatStatLine(character);

  function saveEdit() {
    const parsedMaxHp = Math.max(1, Number(maxHp) || character.maxHp);
    updateCharacter(character.id, {
      name: name.trim() || character.name,
      maxHp: parsedMaxHp,
      ac: ac.trim() === "" ? null : Number(ac),
      notes,
      ...(!isPc && {
        attacks: attacks.trim() === "" ? null : Number(attacks),
        toHit,
        damage,
        abilities,
      }),
    });
    setEditing(false);
  }

  function submitMood(e: React.FormEvent) {
    e.preventDefault();
    setMood(character.id, moodLabel, moodNote.trim());
    setMoodNote("");
    setShowMoodForm(false);
    setShowMoodHistory(true);
  }

  if (editing) {
    return (
      <li className="card character-row">
        <div className="row wrap">
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(e.target.value)}
            title="Max HP"
          />
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(e.target.value)}
            placeholder="AC"
            title="Armor Class"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
        />
        {!isPc && (
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
          <button type="button" onClick={saveEdit}>
            Save
          </button>
          <button type="button" className="ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="card character-row">
      <div className="row space-between">
        <div>
          <span className="card-title">{character.name}</span>
          <span className={`badge type-${character.type}`}>
            {CHARACTER_TYPE_LABELS[character.type]}
          </span>
          {character.mood && (
            <span className={`badge mood-${character.mood}`}>
              {MOOD_DISPLAY[character.mood]}
            </span>
          )}
        </div>
        <div className="row">
          <ExportButton
            filename={`character-${character.name}`}
            build={() => characterToFile(character)}
          />
          <button
            type="button"
            className="ghost small"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger small"
            onClick={() => {
              if (confirm(`Delete ${character.name} from the roster?`)) {
                deleteCharacter(character.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="row stats">
        <span>
          HP: {character.currentHp}/{character.maxHp}
          {character.tempHp > 0 ? ` (+${character.tempHp} temp)` : ""}
        </span>
        {character.ac !== null && <span>AC: {character.ac}</span>}
      </div>

      {statLine && (
        <div className="row stats combat-stat-line">
          <span>⚔ {statLine}</span>
        </div>
      )}
      {!isPc && character.abilities && (
        <p className="abilities-text">{character.abilities}</p>
      )}

      {character.notes && <p className="notes">{character.notes}</p>}

      {character.type === "rival" && (
        <div className="mood-panel">
          <div className="row">
            <button
              type="button"
              className="small"
              onClick={() => setShowMoodForm((v) => !v)}
            >
              {showMoodForm ? "Cancel" : "Update mood"}
            </button>
            {character.moodHistory.length > 0 && (
              <button
                type="button"
                className="ghost small"
                onClick={() => setShowMoodHistory((v) => !v)}
              >
                {showMoodHistory ? "Hide history" : "Show history"}
              </button>
            )}
          </div>

          {showMoodForm && (
            <form className="row wrap" onSubmit={submitMood}>
              <select
                value={moodLabel}
                onChange={(e) => setMoodLabel(e.target.value as typeof moodLabel)}
              >
                {MOOD_LABELS.map((m) => (
                  <option key={m} value={m}>
                    {MOOD_DISPLAY[m]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Why did their mood change?"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
              />
              <button type="submit">Log</button>
            </form>
          )}

          {showMoodHistory && (
            <ul className="mood-history">
              {[...character.moodHistory].reverse().map((ev) => (
                <li key={ev.id}>
                  <span className="mood-history-date">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>{" "}
                  <span className={`badge mood-${ev.label}`}>
                    {MOOD_DISPLAY[ev.label]}
                  </span>
                  {ev.note && <span> — {ev.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
