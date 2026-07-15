import type { Campaign, Encounter, EncounterEvent, NoteBlock, Session } from "../types";

/**
 * A human-readable Markdown "story digest": every read-aloud passage and DM
 * note (session journals + encounter scene text), plus each encounter's
 * event log. Meant as raw material for writing — not re-importable JSON.
 */

function exportedOn(): string {
  return `*Exported ${new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}*`;
}

function blocksToMarkdown(blocks: NoteBlock[]): string {
  return blocks
    .map((b) => (b.kind === "read-aloud" ? `> ${b.text}` : `*DM note: ${b.text}*`))
    .join("\n\n");
}

function eventsToMarkdown(events: EncounterEvent[]): string {
  // A single uniform bullet list — mixing a bare bold line directly against
  // list items (no blank line) isn't reliably parsed as one list everywhere.
  return events
    .map((ev) => (ev.kind === "round" ? `- **${ev.text}**` : `- ${ev.text}`))
    .join("\n");
}

function encounterToMarkdown(encounter: Encounter, level: number): string {
  const h = "#".repeat(level);
  const sections = [`${h} ${encounter.name}`];
  if (encounter.blocks.length > 0) {
    sections.push(blocksToMarkdown(encounter.blocks));
  }
  if (encounter.events.length > 0) {
    sections.push(`${"#".repeat(level + 1)} Log`, eventsToMarkdown(encounter.events));
  }
  return sections.join("\n\n");
}

/** Encounters worth including — anything with narration, notes, or a log. */
function encountersWithContent(encounters: Encounter[]): Encounter[] {
  return encounters.filter((e) => e.blocks.length > 0 || e.events.length > 0);
}

/** Everything under a session heading, excluding the heading itself. */
function sessionContent(
  session: Session,
  encounters: Encounter[],
  encounterLevel: number,
): string[] {
  const sections: string[] = [];
  if (session.notes.length > 0) {
    sections.push(blocksToMarkdown(session.notes));
  }
  for (const enc of encountersWithContent(encounters)) {
    sections.push(encounterToMarkdown(enc, encounterLevel));
  }
  return sections;
}

export function sessionToMarkdown(session: Session, encounters: Encounter[]): string {
  const sections = [
    `# ${session.name}`,
    exportedOn(),
    ...sessionContent(session, encounters, 2),
  ];
  return sections.join("\n\n");
}

export function campaignToMarkdown(
  campaign: Campaign,
  sessions: Session[],
  encountersBySession: Map<string, Encounter[]>,
): string {
  const sections = [`# ${campaign.name}`, exportedOn()];
  for (const session of sessions) {
    const encounters = encountersBySession.get(session.id) ?? [];
    sections.push(`## ${session.name}`, ...sessionContent(session, encounters, 3));
  }
  return sections.join("\n\n");
}
