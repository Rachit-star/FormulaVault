export default function Loading() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(100vh - 54px)',
      color: 'var(--text-muted)',
      fontSize: '13px',
    }}>
      Loading…
    </div>
  )
}
