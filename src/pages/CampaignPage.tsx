import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import { CHARACTER_TYPE_LABELS, CHARACTER_TYPE_ORDER } from "../constants";
import CharacterRow from "../components/CharacterRow";
import AddCharacterForm from "../components/AddCharacterForm";

export default function CampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === campaignId));
  const allCharacters = useStore((s) => s.characters);
  const allSessions = useStore((s) => s.sessions);
  const characters = useMemo(
    () =>
      allCharacters.filter((c) => c.campaignId === campaignId && !c.isTemporary),
    [allCharacters, campaignId],
  );
  const sessions = useMemo(
    () => allSessions.filter((sess) => sess.campaignId === campaignId),
    [allSessions, campaignId],
  );
  const addSession = useStore((s) => s.addSession);
  const deleteSession = useStore((s) => s.deleteSession);

  const [sessionName, setSessionName] = useState("");

  if (!campaignId || !campaign) {
    return <Navigate to="/" replace />;
  }

  function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = sessionName.trim();
    if (!trimmed || !campaignId) return;
    addSession(campaignId, trimmed);
    setSessionName("");
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Campaigns
      </Link>
      <h1>{campaign.name}</h1>

      <section>
        <h2>Roster</h2>
        {CHARACTER_TYPE_ORDER.map((type) => {
          const group = characters.filter((c) => c.type === type);
          if (group.length === 0) return null;
          return (
            <div key={type} className="roster-group">
              <h3>{CHARACTER_TYPE_LABELS[type]}s</h3>
              <ul className="card-list">
                {group.map((c) => (
                  <CharacterRow key={c.id} character={c} />
                ))}
              </ul>
            </div>
          );
        })}
        {characters.length === 0 && <p className="empty">No characters yet.</p>}
        <AddCharacterForm campaignId={campaignId} />
      </section>

      <section>
        <h2>Sessions</h2>
        <form className="row" onSubmit={handleCreateSession}>
          <input
            type="text"
            placeholder="New session name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
          <button type="submit">Create session</button>
        </form>

        {sessions.length === 0 ? (
          <p className="empty">No sessions yet.</p>
        ) : (
          <ul className="card-list">
            {sessions.map((sess) => (
              <li className="card" key={sess.id}>
                <Link
                  to={`/campaigns/${campaignId}/sessions/${sess.id}`}
                  className="card-title"
                >
                  {sess.name}
                </Link>
                <button
                  type="button"
                  className="danger small"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete session "${sess.name}"? This removes its encounters too.`,
                      )
                    ) {
                      deleteSession(sess.id);
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
