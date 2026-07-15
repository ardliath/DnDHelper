import { useState } from "react";
import type { NoteBlock, NoteKind } from "../types";

const KIND_LABEL: Record<NoteKind, string> = {
  "read-aloud": "Read-aloud",
  note: "DM note",
};

function BlockRow({
  block,
  isFirst,
  isLast,
  readOnly,
  onUpdate,
  onRemove,
  onMove,
}: {
  block: NoteBlock;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  onUpdate: (id: string, data: { kind?: NoteKind; text?: string }) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.text);
  const [kind, setKind] = useState<NoteKind>(block.kind);

  function save() {
    const trimmed = text.trim();
    if (trimmed === "") return;
    onUpdate(block.id, { text: trimmed, kind });
    setEditing(false);
  }

  if (editing && !readOnly) {
    return (
      <li className={`card scene-block block-${block.kind}`}>
        <div className="row wrap">
          <select value={kind} onChange={(e) => setKind(e.target.value as NoteKind)}>
            <option value="read-aloud">Read-aloud</option>
            <option value="note">DM note</option>
          </select>
        </div>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
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
        {!readOnly && (
          <div className="row">
            <button
              type="button"
              className="ghost small"
              disabled={isFirst}
              title="Move up"
              onClick={() => onMove(block.id, "up")}
            >
              ↑
            </button>
            <button
              type="button"
              className="ghost small"
              disabled={isLast}
              title="Move down"
              onClick={() => onMove(block.id, "down")}
            >
              ↓
            </button>
            <button type="button" className="ghost small" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              type="button"
              className="danger small"
              onClick={() => onRemove(block.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <p className="scene-block-text">{block.text}</p>
    </li>
  );
}

export default function NoteBlocks({
  heading = "Scene",
  blocks,
  readOnly = false,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: {
  heading?: string;
  blocks: NoteBlock[];
  readOnly?: boolean;
  onAdd: (kind: NoteKind, text: string) => void;
  onUpdate: (id: string, data: { kind?: NoteKind; text?: string }) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<NoteKind>("read-aloud");
  const [text, setText] = useState("");

  function add() {
    const trimmed = text.trim();
    if (trimmed === "") return;
    onAdd(kind, trimmed);
    setText("");
    setAdding(false);
  }

  if (readOnly && blocks.length === 0) return null;

  return (
    <section>
      <h2>{heading}</h2>

      {blocks.length > 0 && (
        <ul className="scene-block-list">
          {blocks.map((b, i) => (
            <BlockRow
              key={b.id}
              block={b}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
              readOnly={readOnly}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </ul>
      )}

      {!readOnly &&
        (adding ? (
          <div className="card">
            <div className="row wrap">
              <select value={kind} onChange={(e) => setKind(e.target.value as NoteKind)}>
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
        ))}
    </section>
  );
}
