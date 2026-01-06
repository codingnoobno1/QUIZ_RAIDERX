// components/Sample.jsx
export default function Sample() {
  return (
    <div style={{
      border: '2px solid #ccc',
      padding: '1rem',
      borderRadius: '8px',
      marginTop: '1rem',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Sample Component</h2>
      <p>This is a sample UI component with some styling.</p>
      <button
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Click Me
      </button>
    </div>
  );
}
