import { useState } from "react";
import type { Character } from "../types";
import { CHARACTER_TYPE_LABELS } from "../constants";
import { useStore } from "../store";

export default function AddFromRoster({
  encounterId,
  available,
}: {
  encounterId: string;
  available: Character[];
}) {
  const addParticipant = useStore((s) => s.addParticipant);
  const [initiatives, setInitiatives] = useState<Record<string, string>>({});

  if (available.length === 0) {
    return <p className="empty">All roster characters are already in this encounter.</p>;
  }

  return (
    <ul className="card-list">
      {available.map((c) => (
        <li className="card row space-between" key={c.id}>
          <div>
            <span className="card-title">{c.name}</span>
            <span className="badge">{CHARACTER_TYPE_LABELS[c.type]}</span>
          </div>
          <div className="row">
            <input
              type="number"
              placeholder="Initiative"
              className="initiative-input"
              value={initiatives[c.id] ?? ""}
              onChange={(e) =>
                setInitiatives((prev) => ({ ...prev, [c.id]: e.target.value }))
              }
            />
            <button
              type="button"
              onClick={() => {
                const value = Number(initiatives[c.id]);
                addParticipant(encounterId, c.id, Number.isFinite(value) ? value : 0);
                setInitiatives((prev) => ({ ...prev, [c.id]: "" }));
              }}
            >
              Add
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
