import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import AddFromRoster from "../components/AddFromRoster";
import AddOneOffForm from "../components/AddOneOffForm";
import CombatantRow from "../components/CombatantRow";
import EncounterBlocks from "../components/EncounterBlocks";
import EncounterEventLog from "../components/EncounterEventLog";

export default function EncounterPage() {
  const { campaignId, sessionId, encounterId } = useParams<{
    campaignId: string;
    sessionId: string;
    encounterId: string;
  }>();

  const session = useStore((s) => s.sessions.find((sess) => sess.id === sessionId));
  const encounter = useStore((s) => s.encounters.find((e) => e.id === encounterId));
  const allCharacters = useStore((s) => s.characters);

  const advanceToPrep = useStore((s) => s.advanceToPrep);
  const startEncounter = useStore((s) => s.startEncounter);
  const nextTurn = useStore((s) => s.nextTurn);
  const prevTurn = useStore((s) => s.prevTurn);
  const endEncounter = useStore((s) => s.endEncounter);
  const reopenEncounter = useStore((s) => s.reopenEncounter);

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

  const phase = encounter.status;
  const isCreate = phase === "create";
  const isPrep = phase === "prep";
  const isRun = phase === "run";
  const isClosed = phase === "closed";

  const participantIds = new Set(encounter.turnOrder.map((t) => t.characterId));
  // Create is for content only — no players. Prep and Run allow any type,
  // so a forgotten monster (or a player) can always be added later.
  const rosterPool = isCreate
    ? rosterCharacters.filter((c) => c.type !== "pc")
    : rosterCharacters;
  const availableFromRoster = rosterPool.filter((c) => !participantIds.has(c.id));
  const entries = encounter.turnOrder.filter((t) => charactersById.has(t.characterId));

  const combatantsHeading = isCreate ? "Combatants" : "Turn order";

  return (
    <div className="page">
      <Link to={`/campaigns/${campaignId}/sessions/${sessionId}`} className="back-link">
        ← {session.name}
      </Link>
      <h1>{encounter.name}</h1>
      <div className="row">
        <span className={`badge phase-${phase}`}>{phase}</span>
        {(isRun || isClosed) && <span>Round {encounter.round}</span>}
      </div>

      <EncounterBlocks
        encounterId={encounterId}
        blocks={encounter.blocks}
        readOnly={isClosed}
      />

      {isCreate && (
        <div className="row turn-controls">
          <button type="button" onClick={() => advanceToPrep(encounterId)}>
            Continue to Prep →
          </button>
        </div>
      )}

      {isPrep && (
        <div className="row turn-controls">
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={() => startEncounter(encounterId)}
          >
            Begin encounter →
          </button>
        </div>
      )}

      {isRun && (
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

      {isClosed && (
        <div className="row turn-controls">
          <button type="button" onClick={() => reopenEncounter(encounterId)}>
            Reopen encounter
          </button>
        </div>
      )}

      <section>
        <h2>{combatantsHeading}</h2>
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
                isCurrentTurn={isRun && index === encounter.currentTurnIndex}
                phase={phase}
              />
            ))}
          </ul>
        )}
      </section>

      {!isClosed && (
        <section>
          <h2>Add combatants</h2>
          <h3>From roster</h3>
          <AddFromRoster
            encounterId={encounterId}
            available={availableFromRoster}
            showInitiative={!isCreate}
          />
          <h3>One-off combatant</h3>
          <AddOneOffForm
            encounterId={encounterId}
            campaignId={campaignId}
            showInitiative={!isCreate}
          />
        </section>
      )}

      {(isRun || isClosed) && (
        <section>
          <h2>{isClosed ? "Recap" : "Log"}</h2>
          <EncounterEventLog
            events={encounter.events}
            collapsible={!isClosed}
            defaultOpen={isClosed}
          />
        </section>
      )}
    </div>
  );
}
