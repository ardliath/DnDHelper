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
  const allEncounters = useStore((s) => s.encounters);
  const characters = useMemo(
    () =>
      allCharacters.filter((c) => c.campaignId === campaignId && !c.isTemporary),
    [allCharacters, campaignId],
  );
  const encounters = useMemo(
    () => allEncounters.filter((e) => e.campaignId === campaignId),
    [allEncounters, campaignId],
  );
  const addEncounter = useStore((s) => s.addEncounter);
  const deleteEncounter = useStore((s) => s.deleteEncounter);

  const [encounterName, setEncounterName] = useState("");

  if (!campaignId || !campaign) {
    return <Navigate to="/" replace />;
  }

  function handleCreateEncounter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = encounterName.trim();
    if (!trimmed || !campaignId) return;
    addEncounter(campaignId, trimmed);
    setEncounterName("");
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
                  to={`/campaigns/${campaignId}/encounters/${enc.id}`}
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
