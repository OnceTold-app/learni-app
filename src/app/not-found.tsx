export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d2b28',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <p
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '80px',
          fontWeight: 900,
          color: '#2ec4b6',
          margin: '0 0 16px',
          lineHeight: 1,
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '24px',
          fontWeight: 800,
          color: '#e8f5f4',
          margin: '0 0 12px',
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          color: '#5a8a84',
          fontSize: '15px',
          marginBottom: '32px',
          maxWidth: '300px',
          lineHeight: 1.6,
        }}
      >
        This page doesn&apos;t exist or may have moved.
      </p>
      <a
        href="/"
        style={{
          background: '#2ec4b6',
          color: '#0d2b28',
          textDecoration: 'none',
          borderRadius: '50px',
          padding: '12px 28px',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          fontSize: '15px',
        }}
      >
        Back to Learni
      </a>
    </div>
  )
}
