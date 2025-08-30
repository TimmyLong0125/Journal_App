import React from 'react';

function Header() {
  const [ping, setPing] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const pingAI = async () => {
    setLoading(true);
    setPing('');
    try {
      const res = await fetch('http://localhost:5001/api/ai/ping', { method: 'POST' });
      const data = await res.json();
      setPing(data.text || (data.ok ? 'ok' : ''));
    } catch {
      setPing('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header>
      <h1>Journal App</h1>
      <button onClick={pingAI} disabled={loading}>{loading ? 'Pinging…' : 'Ping AI'}</button>
      {ping && <span style={{ marginLeft: 8 }}>Result: {ping}</span>}
    </header>
  );
}

export default Header;
