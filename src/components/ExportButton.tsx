import { downloadJson } from "../io/files";

export default function ExportButton({
  filename,
  build,
  label = "Export",
  className = "ghost small",
}: {
  filename: string;
  build: () => unknown;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => downloadJson(filename, build())}
    >
      {label}
    </button>
  );
}
