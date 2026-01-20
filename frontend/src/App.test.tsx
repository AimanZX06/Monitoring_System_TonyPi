import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>TonyPi Monitoring System</h1>
      <p style={{ color: '#666' }}>Test - If you can see this, React is working!</p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        border: '1px solid #ccc',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>System Status</h2>
        <p>✅ React App Loading</p>
        <p>✅ JavaScript Enabled</p>
        <p>✅ Basic Styling Working</p>
      </div>
    </div>
  );
}

export default App;