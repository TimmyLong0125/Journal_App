import React, { useState } from 'react';

function TherapistChat({ seedEntryId = null }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]); // {role, content, usedEntries?}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question && !seedEntryId) return;

    const userMsg = { role: 'user', content: question || '(Discuss the selected entry)' };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/therapist/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          entryId: seedEntryId || undefined,
          conversationId
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Therapist response failed');
      }
      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: data.response, usedEntries: data.usedEntries || [] }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, margin: '12px 0' }}>
      <h3>Therapist Chat</h3>
      <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8, background: '#fafafa' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <strong>{m.role === 'user' ? 'You' : 'Therapist'}:</strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            {m.usedEntries && m.usedEntries.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <small>Context:</small>{' '}
                {m.usedEntries.map((u, j) => (
                  <span key={j} style={{ display: 'inline-block', padding: '2px 6px', border: '1px solid #ccc', borderRadius: 12, marginRight: 6 }}>
                    {u.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div>Thinking…</div>}
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          type="text"
          placeholder={seedEntryId ? 'Ask about this entry...' : 'Ask a question...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={loading || (!input.trim() && !seedEntryId)}>
          Send
        </button>
        <button type="button" onClick={newChat} disabled={loading}>
          New Chat
        </button>
      </form>
    </div>
  );
}

export default TherapistChat;
