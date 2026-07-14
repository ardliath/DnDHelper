import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import AddFromRoster from "../components/AddFromRoster";
import AddOneOffForm from "../components/AddOneOffForm";
import CombatantRow from "../components/CombatantRow";
import EncounterBlocks from "../components/EncounterBlocks";

export default function EncounterPage() {
  const { campaignId, sessionId, encounterId } = useParams<{
    campaignId: string;
    sessionId: string;
    encounterId: string;
  }>();

  const session = useStore((s) => s.sessions.find((sess) => sess.id === sessionId));
  const encounter = useStore((s) => s.encounters.find((e) => e.id === encounterId));
  const allCharacters = useStore((s) => s.characters);

  const startEncounter = useStore((s) => s.startEncounter);
  const nextTurn = useStore((s) => s.nextTurn);
  const prevTurn = useStore((s) => s.prevTurn);
  const endEncounter = useStore((s) => s.endEncounter);

  const rosterCharacters = useMemo(
    () =>
      allCharacters.filter((c) => c.campaignId === campaignId && !c.isTemporary),
    [allCharacters, campaignId],
  );
  const charactersById = useMemo(
    () => new Map(allCharacters.map((c) => [c.id, c])),
    [allCharacters],
  );

  if (!campaignId || !sessionId || !encounterId || !session || !encounter) {
    return <Navigate to="/" replace />;
  }

  const participantIds = new Set(encounter.turnOrder.map((t) => t.characterId));
  const availableFromRoster = rosterCharacters.filter((c) => !participantIds.has(c.id));
  const entries = encounter.turnOrder.filter((t) => charactersById.has(t.characterId));

  const isSetup = encounter.status === "setup";
  const isActive = encounter.status === "active";
  const isCompleted = encounter.status === "completed";

  return (
    <div className="page">
      <Link to={`/campaigns/${campaignId}/sessions/${sessionId}`} className="back-link">
        ← {session.name}
      </Link>
      <h1>{encounter.name}</h1>
      <div className="row">
        <span className="badge">{encounter.status}</span>
        {(isActive || isCompleted) && <span>Round {encounter.round}</span>}
      </div>

      <EncounterBlocks encounterId={encounterId} blocks={encounter.blocks} />

      {isActive && (
        <div className="row turn-controls">
          <button type="button" onClick={() => prevTurn(encounterId)}>
            ← Previous turn
          </button>
          <button type="button" onClick={() => nextTurn(encounterId)}>
            Next turn →
          </button>
          <button type="button" className="ghost" onClick={() => endEncounter(encounterId)}>
            End encounter
          </button>
        </div>
      )}

      {isSetup && (
        <div className="row turn-controls">
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={() => startEncounter(encounterId)}
          >
            Start encounter
          </button>
        </div>
      )}

      <section>
        <h2>Turn order</h2>
        {entries.length === 0 ? (
          <p className="empty">No combatants added yet.</p>
        ) : (
          <ul className="card-list">
            {entries.map((entry, index) => (
              <CombatantRow
                key={entry.characterId}
                entry={entry}
                character={charactersById.get(entry.characterId)!}
                encounterId={encounterId}
                isCurrentTurn={isActive && index === encounter.currentTurnIndex}
                editableInitiative={!isCompleted}
              />
            ))}
          </ul>
        )}
      </section>

      {!isCompleted && (
        <section>
          <h2>Add combatants</h2>
          <h3>From roster</h3>
          <AddFromRoster encounterId={encounterId} available={availableFromRoster} />
          <h3>One-off combatant</h3>
          <AddOneOffForm encounterId={encounterId} campaignId={campaignId} />
        </section>
      )}
    </div>
  );
}
