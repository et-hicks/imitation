export default function Spinner({ size = 24 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <div
      role="status"
      aria-label="loading"
      className="inline-block animate-spin rounded-full border-2 border-white/30 border-t-white"
      style={{ width: px, height: px }}
    />
  );
}


