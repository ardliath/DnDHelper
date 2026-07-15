import { useState } from "react";
import { Link } from "react-router-dom";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="codeblock">
      <button
        type="button"
        className="ghost small copy-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard unavailable; ignore */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CHARACTER_EXAMPLE = `{
  "formatVersion": 1,
  "kind": "character",
  "character": {
    "name": "Prophetess Ophelia",
    "type": "rival",
    "maxHp": 40,
    "ac": 15,
    "notes": "Leader of the rival party",
    "mood": "unfriendly",
    "attacks": 2,
    "toHit": "+7",
    "damage": "1d8+4 radiant",
    "abilities": "Turn Undead (recharge 5-6): each undead within 30 ft must save or flee.",
    "avatar": "https://example.com/portraits/ophelia.jpg"
  }
}`;

const ENCOUNTER_EXAMPLE = `{
  "formatVersion": 1,
  "kind": "encounter",
  "encounter": {
    "name": "The Gnashing Halls",
    "blocks": [
      { "kind": "read-aloud", "text": "The corridor opens into a vaulted hall, its floor slick with something dark." },
      { "kind": "note", "text": "The grick drops from the ceiling on the first round." }
    ],
    "combatants": [
      { "name": "Aerin", "initiative": 18 },
      { "name": "Grick", "type": "monster", "maxHp": 27, "ac": 14, "initiative": 10, "attacks": 1, "toHit": "+5", "damage": "2d6+3 piercing", "abilities": "Camouflage: has advantage on Stealth checks in rocky terrain." }
    ]
  }
}`;

const SESSION_EXAMPLE = `{
  "formatVersion": 1,
  "kind": "session",
  "session": {
    "name": "Session 4: The Sunrise Steps",
    "roster": [
      { "name": "Prophetess Ophelia", "type": "rival", "maxHp": 40, "ac": 15, "mood": "unfriendly" }
    ],
    "notes": [
      { "kind": "read-aloud", "text": "The road north climbs steadily out of the valley, the trees thinning to bare rock." },
      { "kind": "note", "text": "If asked, a passing merchant mentions goblin sign near the steps." }
    ],
    "encounters": [
      {
        "name": "Ambush at the Sunrise Steps",
        "blocks": [
          { "kind": "read-aloud", "text": "Dawn spills over the steps as crossbow bolts hiss from the rocks above." }
        ],
        "combatants": [
          { "name": "Aerin", "initiative": 15 },
          { "name": "Goblin Sharpshooter", "type": "monster", "maxHp": 7, "ac": 14, "initiative": 12 },
          { "name": "Goblin Sharpshooter", "type": "monster", "maxHp": 7, "ac": 14, "initiative": 9 }
        ]
      }
    ]
  }
}`;

const AI_PROMPT = `You are designing a Dungeons & Dragons session for my "DnD Helper" app.
Output ONLY a single JSON code block (no commentary) in exactly this shape:

{
  "formatVersion": 1,
  "kind": "session",
  "session": {
    "name": "<session title>",
    "roster": [
      { "name": "<recurring NPC>", "type": "rival|monster|other", "maxHp": 0, "ac": 0, "mood": "hostile|unfriendly|neutral|friendly|allied" }
    ],
    "notes": [
      { "kind": "read-aloud", "text": "<narration for travel/exploration between encounters>" },
      { "kind": "note", "text": "<private DM prep for the journey>" }
    ],
    "encounters": [
      {
        "name": "<encounter name>",
        "blocks": [
          { "kind": "read-aloud", "text": "<narration to read to the players>" },
          { "kind": "note", "text": "<private DM note or tactics>" }
        ],
        "combatants": [
          { "name": "<one of my player characters>", "initiative": 0 },
          { "name": "<monster>", "type": "monster", "maxHp": 0, "ac": 0, "initiative": 0, "attacks": 0, "toHit": "+0", "damage": "0d0+0 type", "abilities": "<short special ability description, if any>" }
        ]
      }
    ]
  }
}

Rules:
- Use "blocks"/"notes" for scene text: "read-aloud" for narration read to
  players, "note" for private DM prep. Both are optional; add as many as you like.
- An encounter can be pure scene-setting with "blocks" and no "combatants".
- A session can be pure exploration/travel too — put everything in the
  session's "notes" and use an empty or omitted "encounters" list.
- My player characters are: <LIST YOUR PCs HERE>. Reference them by name only, with
  no stat block — they already exist in my roster.
- Every monster or NPC that is not one of my players MUST include a stat block with
  at least "maxHp" (add "type" and "ac" too where you can).
- Give every monster/NPC combatant "attacks" (number per turn), "toHit"
  (e.g. "+5"), and "damage" (e.g. "1d8+3 slashing") so I can run it quickly
  at the table. Include "abilities" for anything with a notable trait or
  special action. Skip these four fields entirely for player characters.
- For several identical monsters, list them separately with distinct names
  (e.g. "Goblin 1", "Goblin 2").
- "initiative" is optional — leave it out if I should roll at the table.
- "roster" is optional; use it only for recurring named NPCs/rivals worth keeping.

Now design: <DESCRIBE THE SESSION — theme, number of encounters, party level, difficulty>.`;

export default function FormatsPage() {
  return (
    <div className="page prose">
      <Link to="/" className="back-link">
        ← Campaigns
      </Link>
      <h1>Import &amp; Export Formats</h1>

      <p>
        Everything in DnD Helper is plain JSON. You can export a character,
        an encounter, a whole session, or an entire campaign to a{" "}
        <code>.json</code> file, and import those files back into any campaign —
        on this machine or another. This also means you can author content
        elsewhere (by hand, or with an AI) and upload it.
      </p>

      <h2>How characters are matched</h2>
      <p>
        Combatants are referenced <strong>by name</strong>. When you import an
        encounter or session:
      </p>
      <ul>
        <li>
          If a combatant&rsquo;s name matches a character already in the target
          campaign&rsquo;s roster (your PCs, rivals), that character is reused.
        </li>
        <li>
          Otherwise the combatant must include its own stat block (at least{" "}
          <code>maxHp</code>). It becomes a <em>per-encounter combatant</em> —
          its own instance with independent HP, just like a one-off you&rsquo;d
          add during a fight. It is not added to the permanent roster.
        </li>
        <li>
          A top-level <code>roster</code> list (on a session or campaign) adds
          recurring named NPCs to the campaign roster. Names already present are
          left untouched — imports only ever add, never overwrite or delete.
        </li>
      </ul>

      <h2>Common fields</h2>
      <p>
        Every file has <code>"formatVersion": 1</code> and a <code>"kind"</code>{" "}
        of <code>character</code>, <code>encounter</code>, <code>session</code>,
        or <code>campaign</code>.
      </p>
      <table className="schema-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>name</code>
            </td>
            <td>string</td>
            <td>Required on characters, encounters, sessions, campaigns.</td>
          </tr>
          <tr>
            <td>
              <code>type</code>
            </td>
            <td>enum</td>
            <td>
              <code>pc</code>, <code>rival</code>, <code>monster</code>, or{" "}
              <code>other</code>. Required on roster characters; on a combatant
              it defaults to <code>monster</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>maxHp</code>
            </td>
            <td>number &gt; 0</td>
            <td>Required for any character defined by a stat block.</td>
          </tr>
          <tr>
            <td>
              <code>ac</code>
            </td>
            <td>number / null</td>
            <td>Optional armour class.</td>
          </tr>
          <tr>
            <td>
              <code>notes</code>
            </td>
            <td>string</td>
            <td>Optional freeform notes.</td>
          </tr>
          <tr>
            <td>
              <code>mood</code>
            </td>
            <td>enum</td>
            <td>
              Rivals only: <code>hostile</code>, <code>unfriendly</code>,{" "}
              <code>neutral</code>, <code>friendly</code>, <code>allied</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>initiative</code>
            </td>
            <td>number</td>
            <td>Optional on a combatant; defaults to 0 if omitted.</td>
          </tr>
          <tr>
            <td>
              <code>attacks</code>
            </td>
            <td>number &gt; 0</td>
            <td>
              Optional. Number of attacks per turn — quick reference for
              running the creature.
            </td>
          </tr>
          <tr>
            <td>
              <code>toHit</code>
            </td>
            <td>string</td>
            <td>
              Optional. Freeform, e.g. <code>"+5"</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>damage</code>
            </td>
            <td>string</td>
            <td>
              Optional. Freeform, e.g. <code>"1d8+3 slashing"</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>abilities</code>
            </td>
            <td>string</td>
            <td>Optional. Special abilities or traits, freeform.</td>
          </tr>
          <tr>
            <td>
              <code>avatar</code>
            </td>
            <td>string</td>
            <td>
              Optional. A portrait — an <code>http(s)</code> image link. Roster
              characters only (not combatants with an inline stat block).
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>attacks</code>, <code>toHit</code>, <code>damage</code>, and{" "}
        <code>abilities</code> are meant for monsters/NPCs you need to run in a
        fight — the app doesn&rsquo;t show them for player characters.{" "}
        <code>avatar</code> works for any character, players included; in the
        app itself you can also upload a photo directly, which gets stored as
        a compressed thumbnail rather than a link.
      </p>

      <h2>Session</h2>
      <p>
        The main unit for authoring. A session has an optional <code>roster</code>{" "}
        (recurring NPCs), an optional <code>notes</code> journal, and a list of{" "}
        <code>encounters</code>, each with <code>combatants</code>. Import a
        session from a campaign page.
      </p>
      <p>
        <code>notes</code> is a freeform journal for anything that isn&rsquo;t
        combat — travel, exploration, roleplay, downtime. It uses the same block
        shape as an encounter&rsquo;s <code>blocks</code> (<code>kind</code> of{" "}
        <code>read-aloud</code> or <code>note</code>, plus <code>text</code>), so
        you can describe a session that&rsquo;s pure journey with no{" "}
        <code>encounters</code> at all.
      </p>
      <CodeBlock code={SESSION_EXAMPLE} />

      <h2>Encounter</h2>
      <p>
        A single encounter with its combatants and, optionally,{" "}
        <code>blocks</code> — ordered scene paragraphs. Each block has a{" "}
        <code>kind</code> of <code>read-aloud</code> (narration for players) or{" "}
        <code>note</code> (private DM prep), and a <code>text</code> string. An
        encounter can be pure scene-setting: blocks with no combatants. Import
        an encounter from a session page — it&rsquo;s added to that session.
      </p>
      <CodeBlock code={ENCOUNTER_EXAMPLE} />

      <h2>Character</h2>
      <p>
        A single roster character. Import a character from a campaign page — it
        is added to that campaign&rsquo;s roster.
      </p>
      <CodeBlock code={CHARACTER_EXAMPLE} />

      <h2>Campaign</h2>
      <p>
        A full campaign export bundles the roster plus every session and
        encounter. Importing one creates a brand-new campaign.
      </p>

      <h2>What isn&rsquo;t included</h2>
      <p>
        Every export (character, encounter, session, or campaign) captures your{" "}
        <em>setup</em>, not a live moment. Specifically:
      </p>
      <ul>
        <li>
          HP resets to full and an imported encounter always starts fresh at{" "}
          <code>create</code> — its live run-state (round number, whose turn it
          is, status) is never carried over, even if you export an encounter
          that&rsquo;s mid-fight or closed.
        </li>
        <li>
          The combat log (round-by-round damage/heal events) isn&rsquo;t part of
          this format at all — that&rsquo;s what &ldquo;Download session
          log&rdquo;/&ldquo;Download campaign log&rdquo; are for, a separate
          Markdown export meant for reading, not re-importing.
        </li>
        <li>
          A rival&rsquo;s current <code>mood</code> is included, but their mood{" "}
          <em>history</em> (the timestamped log of what shifted it) is not.
        </li>
      </ul>

      <h2>Designing a session with an AI</h2>
      <p>
        Paste this prompt into your AI of choice, fill in the two{" "}
        <code>&lt;...&gt;</code> placeholders, and import the JSON it returns via
        &ldquo;Import a session&rdquo; on a campaign page.
      </p>
      <CodeBlock code={AI_PROMPT} />
    </div>
  );
}
