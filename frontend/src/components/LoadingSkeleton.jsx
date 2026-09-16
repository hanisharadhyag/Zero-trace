/**
 * LoadingSkeleton — Shimmer loading placeholder
 * Props: width, height, borderRadius, count, style
 */
export default function LoadingSkeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  count = 1,
  style = {},
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
            borderRadius,
            marginBottom: i < count - 1 ? 12 : 0,
            ...style,
          }}
        />
      ))}
    </>
  );
}

/**
 * CardSkeleton — Full card skeleton for dashboard loading
 */
export function CardSkeleton() {
  return (
    <div
      className="glass-card"
      style={{ padding: 24 }}
    >
      <LoadingSkeleton height={14} width="50%" borderRadius={6} />
      <LoadingSkeleton height={44} width="70%" borderRadius={8} style={{ marginTop: 12 }} />
      <LoadingSkeleton height={12} width="40%" borderRadius={6} style={{ marginTop: 8 }} />
    </div>
  );
}
