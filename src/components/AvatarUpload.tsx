import { useRef, useState } from "react";
import { fileToThumbnailDataUrl } from "../imageUtils";
import Avatar from "./Avatar";

/** Upload-a-photo-or-paste-a-link control, paired with a live preview. */
export default function AvatarUpload({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const dataUrl = await fileToThumbnailDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput("");
    setShowUrlField(false);
  }

  return (
    <div className="avatar-upload row">
      <Avatar name={name} avatar={value} size="md" />
      <div className="avatar-upload-controls">
        <div className="row wrap">
          <button
            type="button"
            className="ghost small"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload photo
          </button>
          <button
            type="button"
            className="ghost small"
            onClick={() => setShowUrlField((v) => !v)}
          >
            {showUrlField ? "Cancel" : "Paste link"}
          </button>
          {value && (
            <button
              type="button"
              className="ghost small"
              onClick={() => {
                onChange(null);
                setError("");
              }}
            >
              Remove
            </button>
          )}
        </div>
        {showUrlField && (
          <form className="row" onSubmit={submitUrl}>
            <input
              type="text"
              placeholder="https://…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="small">
              Use
            </button>
          </form>
        )}
        {error && <p className="avatar-upload-error">{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
