import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";

export default function CampaignListPage() {
  const campaigns = useStore((s) => s.campaigns);
  const addCampaign = useStore((s) => s.addCampaign);
  const deleteCampaign = useStore((s) => s.deleteCampaign);
  const [name, setName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addCampaign(trimmed);
    setName("");
  }

  return (
    <div className="page">
      <h1>Campaigns</h1>

      <form className="row" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Create campaign</button>
      </form>

      {campaigns.length === 0 ? (
        <p className="empty">No campaigns yet. Create one above.</p>
      ) : (
        <ul className="card-list">
          {campaigns.map((c) => (
            <li className="card" key={c.id}>
              <Link to={`/campaigns/${c.id}`} className="card-title">
                {c.name}
              </Link>
              <button
                type="button"
                className="danger small"
                onClick={() => {
                  if (confirm(`Delete campaign "${c.name}"? This removes its roster and encounters too.`)) {
                    deleteCampaign(c.id);
                  }
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
