export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, #1a0d3d 0%, #07061a 70%)',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '3rem', color: '#fbbf24' }}>
        NEURAX
      </h1>
      <p style={{ color: '#94a3b8' }}>Tu leyenda se construye cada día.</p>
      <code style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2rem' }}>
        Estado base — listo para implementar
      </code>
    </main>
  )
}
