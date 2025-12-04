export function SkeletonLine({ height = 14, width = '100%' }) {
  return <div className="skeleton" style={{ height, width, borderRadius: 8 }} />
}

export function TableSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div>
      {[...Array(rows)].map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginBottom: 8 }}>
          {[...Array(cols)].map((__, c) => (
            <SkeletonLine key={c} height={16} />
          ))}
        </div>
      ))}
    </div>
  )
}

