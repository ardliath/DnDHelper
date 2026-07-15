/** A small circular portrait, falling back to an initial letter when there's no image. */
export default function Avatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar: string | null;
  size?: "sm" | "md";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`avatar avatar-${size}`}>
      {avatar ? (
        <img src={avatar} alt="" />
      ) : (
        <span className="avatar-fallback">{initial}</span>
      )}
    </span>
  );
}
