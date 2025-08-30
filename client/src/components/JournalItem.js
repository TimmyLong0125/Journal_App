import React from 'react';

function JournalItem({ entry, onDeleteEntry }) {
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [summary, setSummary] = React.useState('');
  const [loadingReflection, setLoadingReflection] = React.useState(false);
  const [reflection, setReflection] = React.useState('');
  const [error, setError] = React.useState(null);
  const [analysis, setAnalysis] = React.useState(entry || {}); // Store full entry with analysis
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);

  React.useEffect(() => {
      setAnalysis(entry);
  }, [entry]);

  const handleSummarize = async () => {
    setLoadingSummary(true);
    setSummary('');
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/journal/${entry._id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: 0.3,
          maxTokens: 1024,
          format: 'markdown',
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError('Could not generate summary. Check console.');
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleReflect = async () => {
    setLoadingReflection(true);
    setReflection('');
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/journal/${entry._id}/reflect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: 0.7,
          maxTokens: 2048,
          format: 'markdown',
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Reflection request failed');
      }
      const data = await res.json();
      const text = (data && typeof data.reflection === 'string') ? data.reflection.trim() : '';
      if (!text) {
        setError('No reflection generated. Please try again.');
      } else {
        setReflection(text);
      }
    } catch (err) {
      setError(err.message || 'Could not generate reflection. Check console.');
      console.error(err);
    } finally {
      setLoadingReflection(false);
    }
  };

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/journal/${entry._id}/analyze`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Analysis request failed');
      }
      const updatedEntry = await res.json();
      setAnalysis(updatedEntry); // Update local state with new analysis fields
    } catch (err) {
      setError(err.message || 'Could not generate analysis. Check console.');
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      alert('Copy failed');
    }
  };

  return (
    <div className="journal-item">
      <h3>{entry.title}</h3>
      <p>{entry.content}</p>

      {/* Controls */}
      <button onClick={() => onDeleteEntry(entry._id)} disabled={loadingSummary || loadingReflection}>Delete</button>
      <button onClick={handleSummarize} disabled={loadingSummary || loadingReflection}>
        {loadingSummary ? 'Summarizing…' : 'Summarize'}
      </button>
      <button onClick={handleReflect} disabled={loadingSummary || loadingReflection}>
        {loadingReflection ? 'Reflecting…' : 'Reflect'}
      </button>
      <button onClick={handleAnalyze} disabled={loadingSummary || loadingReflection || loadingAnalysis}>
        {loadingAnalysis ? 'Analyzing…' : 'Analyze'}
      </button>

      {/* Error */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Analysis Insights */}
      {loadingAnalysis && <p>Loading analysis...</p>}
      {analysis.emotions && analysis.emotions.length > 0 && (
        <div className="analysis-box">
          <strong>Analysis:</strong>
          <div className="chips-container">
            {analysis.emotions.map((emo, i) => <span key={i} className="chip emotion-chip">{emo}</span>)}
            {analysis.topics.map((top, i) => <span key={i} className="chip topic-chip">{top}</span>)}
            {analysis.sentiment != null && <span className="chip sentiment-chip">Sentiment: {analysis.sentiment.toFixed(2)}</span>}
          </div>
          {analysis.keyInsights && analysis.keyInsights.length > 0 && (
            <div className="insights-list">
              <strong>Key Insights:</strong>
              <ul>
                {analysis.keyInsights.map((insight, i) => <li key={i}>{insight}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {loadingSummary && <p>Loading summary…</p>}
      {summary && (
        <div className="summary-box">
          <strong>Summary:</strong>
          <div>{summary}</div>
          <button onClick={() => copyToClipboard(summary)}>Copy</button>
        </div>
      )}

      {/* Reflection */}
      {loadingReflection && <p>Generating reflection…</p>}
      {reflection && (
        <div className="reflection-box">
          <strong>Reflection:</strong>
          <div>{reflection}</div>
          <button onClick={() => copyToClipboard(reflection)}>Copy</button>
        </div>
      )}
    </div>
  );
}

export default JournalItem;