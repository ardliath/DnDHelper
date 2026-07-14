import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import ExportButton from "../components/ExportButton";
import ImportPanel from "../components/ImportPanel";
import { noPlan, planEncounterImport } from "../io/apply";
import { encounterToFile, sessionToFile } from "../io/exporters";
import type { AnyFile } from "../io/formats";
import type { Character } from "../types";

export default function SessionPage() {
  const { campaignId, sessionId } = useParams<{
    campaignId: string;
    sessionId: string;
  }>();

  const campaign = useStore((s) => s.campaigns.find((c) => c.id === campaignId));
  const session = useStore((s) => s.sessions.find((sess) => sess.id === sessionId));
  const allEncounters = useStore((s) => s.encounters);
  const allCharacters = useStore((s) => s.characters);
  const encounters = useMemo(
    () => allEncounters.filter((e) => e.sessionId === sessionId),
    [allEncounters, sessionId],
  );
  const charactersById = useMemo(
    () => new Map(allCharacters.map((c) => [c.id, c])),
    [allCharacters],
  );
  const addEncounter = useStore((s) => s.addEncounter);
  const deleteEncounter = useStore((s) => s.deleteEncounter);
  const moveEncounter = useStore((s) => s.moveEncounter);

  const [encounterName, setEncounterName] = useState("");

  if (!campaignId || !sessionId || !campaign || !session) {
    return <Navigate to="/" replace />;
  }

  function handleCreateEncounter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = encounterName.trim();
    if (!trimmed || !sessionId) return;
    addEncounter(sessionId, trimmed);
    setEncounterName("");
  }

  function currentRoster(): Character[] {
    const state = useStore.getState();
    return state.characters.filter(
      (c) => c.campaignId === campaignId && !c.isTemporary,
    );
  }

  function buildPlan(file: AnyFile) {
    if (file.kind === "encounter")
      return planEncounterImport(
        currentRoster(),
        campaignId!,
        sessionId!,
        file.encounter,
      );
    return noPlan("Unexpected file kind.");
  }

  return (
    <div className="page">
      <Link to={`/campaigns/${campaignId}`} className="back-link">
        ← {campaign.name}
      </Link>
      <h1>{session.name}</h1>

      <section>
        <h2>Encounters</h2>
        <form className="row" onSubmit={handleCreateEncounter}>
          <input
            type="text"
            placeholder="New encounter name"
            value={encounterName}
            onChange={(e) => setEncounterName(e.target.value)}
          />
          <button type="submit">Create encounter</button>
        </form>

        {encounters.length === 0 ? (
          <p className="empty">No encounters yet.</p>
        ) : (
          <ul className="card-list">
            {encounters.map((enc, i) => (
              <li className="card row space-between" key={enc.id}>
                <div>
                  <Link
                    to={`/campaigns/${campaignId}/sessions/${sessionId}/encounters/${enc.id}`}
                    className="card-title"
                  >
                    {enc.name}
                  </Link>
                  <span className={`badge phase-${enc.status}`}>{enc.status}</span>
                  {(enc.status === "run" || enc.status === "closed") && (
                    <span>Round {enc.round}</span>
                  )}
                </div>
                <div className="row">
                  <button
                    type="button"
                    className="ghost small"
                    disabled={i === 0}
                    title="Move up"
                    onClick={() => moveEncounter(sessionId, enc.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ghost small"
                    disabled={i === encounters.length - 1}
                    title="Move down"
                    onClick={() => moveEncounter(sessionId, enc.id, "down")}
                  >
                    ↓
                  </button>
                  <ExportButton
                    filename={`encounter-${enc.name}`}
                    build={() => encounterToFile(enc, charactersById)}
                  />
                  <button
                    type="button"
                    className="danger small"
                    onClick={() => {
                      if (confirm(`Delete encounter "${enc.name}"?`)) {
                        deleteEncounter(enc.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Import / Export</h2>
        <div className="io-bar">
          <ImportPanel
            label="Import an encounter…"
            accept={["encounter"]}
            buildPlan={buildPlan}
          />
          <ExportButton
            className="ghost small"
            label="Export whole session"
            filename={`session-${session.name}`}
            build={() => sessionToFile(session, encounters, charactersById)}
          />
        </div>
      </section>
    </div>
  );
}
