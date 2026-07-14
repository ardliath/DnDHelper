import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useStore } from "../store";

export default function SessionPage() {
  const { campaignId, sessionId } = useParams<{
    campaignId: string;
    sessionId: string;
  }>();

  const campaign = useStore((s) => s.campaigns.find((c) => c.id === campaignId));
  const session = useStore((s) => s.sessions.find((sess) => sess.id === sessionId));
  const allEncounters = useStore((s) => s.encounters);
  const encounters = useMemo(
    () => allEncounters.filter((e) => e.sessionId === sessionId),
    [allEncounters, sessionId],
  );
  const addEncounter = useStore((s) => s.addEncounter);
  const deleteEncounter = useStore((s) => s.deleteEncounter);

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
            {encounters.map((enc) => (
              <li className="card" key={enc.id}>
                <Link
                  to={`/campaigns/${campaignId}/sessions/${sessionId}/encounters/${enc.id}`}
                  className="card-title"
                >
                  {enc.name}
                </Link>
                <span className="badge">{enc.status}</span>
                {enc.status === "active" && <span>Round {enc.round}</span>}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
