import { useState } from "react";
import type { EncounterEvent } from "../types";

export default function EncounterEventLog({
  events,
  collapsible = true,
  defaultOpen = false,
}: {
  events: EncounterEvent[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || !collapsible);

  if (events.length === 0) {
    return <p className="empty">Nothing has happened yet.</p>;
  }

  return (
    <div className="event-log">
      {collapsible && (
        <button type="button" className="ghost small" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide log" : `Show log (${events.length})`}
        </button>
      )}
      {open && (
        <ol className="event-log-list">
          {events.map((ev) => (
            <li
              key={ev.id}
              className={
                ev.kind === "round"
                  ? "event-log-round"
                  : `event-log-entry event-${ev.kind}`
              }
            >
              {ev.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
