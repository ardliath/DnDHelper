import { useState } from "react";
import type { EncounterBlock, EncounterBlockKind } from "../types";
import { useStore } from "../store";

const KIND_LABEL: Record<EncounterBlockKind, string> = {
  "read-aloud": "Read-aloud",
  note: "DM note",
};

function BlockRow({
  block,
  encounterId,
  isFirst,
  isLast,
}: {
  block: EncounterBlock;
  encounterId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const updateEncounterBlock = useStore((s) => s.updateEncounterBlock);
  const removeEncounterBlock = useStore((s) => s.removeEncounterBlock);
  const moveEncounterBlock = useStore((s) => s.moveEncounterBlock);

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.text);
  const [kind, setKind] = useState<EncounterBlockKind>(block.kind);

  function save() {
    const trimmed = text.trim();
    if (trimmed === "") return;
    updateEncounterBlock(encounterId, block.id, { text: trimmed, kind });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className={`card scene-block block-${block.kind}`}>
        <div className="row wrap">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as EncounterBlockKind)}
          >
            <option value="read-aloud">Read-aloud</option>
            <option value="note">DM note</option>
          </select>
        </div>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row">
          <button type="button" onClick={save}>
            Save
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setText(block.text);
              setKind(block.kind);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`scene-block block-${block.kind}`}>
      <div className="row space-between scene-block-head">
        <span className="scene-block-label">{KIND_LABEL[block.kind]}</span>
        <div className="row">
          <button
            type="button"
            className="ghost small"
            disabled={isFirst}
            title="Move up"
            onClick={() => moveEncounterBlock(encounterId, block.id, "up")}
          >
            ↑
          </button>
          <button
            type="button"
            className="ghost small"
            disabled={isLast}
            title="Move down"
            onClick={() => moveEncounterBlock(encounterId, block.id, "down")}
          >
            ↓
          </button>
          <button
            type="button"
            className="ghost small"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger small"
            onClick={() => removeEncounterBlock(encounterId, block.id)}
          >
            Delete
          </button>
        </div>
      </div>
      <p className="scene-block-text">{block.text}</p>
    </li>
  );
}

export default function EncounterBlocks({
  encounterId,
  blocks,
}: {
  encounterId: string;
  blocks: EncounterBlock[];
}) {
  const addEncounterBlock = useStore((s) => s.addEncounterBlock);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<EncounterBlockKind>("read-aloud");
  const [text, setText] = useState("");

  function add() {
    const trimmed = text.trim();
    if (trimmed === "") return;
    addEncounterBlock(encounterId, kind, trimmed);
    setText("");
    setAdding(false);
  }

  return (
    <section>
      <h2>Scene</h2>

      {blocks.length > 0 && (
        <ul className="scene-block-list">
          {blocks.map((b, i) => (
            <BlockRow
              key={b.id}
              block={b}
              encounterId={encounterId}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
            />
          ))}
        </ul>
      )}

      {adding ? (
        <div className="card">
          <div className="row wrap">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as EncounterBlockKind)}
            >
              <option value="read-aloud">Read-aloud</option>
              <option value="note">DM note</option>
            </select>
          </div>
          <textarea
            rows={4}
            placeholder="Paragraph text…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="row">
            <button type="button" onClick={add} disabled={text.trim() === ""}>
              Add paragraph
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setText("");
                setAdding(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}>
          + Add paragraph
        </button>
      )}
    </section>
  );
}
