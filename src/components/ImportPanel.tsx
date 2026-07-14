import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { parseImport, type AnyFile, type ExportKind } from "../io/formats";
import type { ImportPlan } from "../io/apply";
import { useStore } from "../store";

export default function ImportPanel({
  label,
  accept,
  buildPlan,
}: {
  label: string;
  accept: ExportKind[];
  buildPlan: (file: AnyFile) => ImportPlan;
}) {
  const commitImport = useStore((s) => s.commitImport);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function runImport(raw: string) {
    setErrors([]);
    setSuccess(null);
    const parsed = parseImport(raw);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    if (!accept.includes(parsed.file.kind)) {
      setErrors([
        `This importer accepts ${accept.join(" / ")} files, but the file is a "${parsed.file.kind}".`,
      ]);
      return;
    }
    const plan = buildPlan(parsed.file);
    if (plan.errors.length > 0) {
      setErrors(plan.errors);
      return;
    }
    commitImport(plan);
    setSuccess(plan.summary);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    runImport(content);
  }

  if (!open) {
    return (
      <button type="button" className="ghost small" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className="card import-panel">
      <div className="row space-between">
        <strong>{label}</strong>
        <button
          type="button"
          className="ghost small"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
      <p className="io-hint">
        Paste JSON below or choose a file. See the{" "}
        <Link to="/formats">format guide</Link> for the schema.
      </p>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'{\n  "formatVersion": 1,\n  "kind": "session",\n  ...\n}'}
      />
      <div className="row wrap">
        <button
          type="button"
          onClick={() => runImport(text)}
          disabled={text.trim() === ""}
        >
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
        />
      </div>
      {errors.length > 0 && (
        <ul className="io-errors">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {success && <p className="io-success">{success}</p>}
    </div>
  );
}
