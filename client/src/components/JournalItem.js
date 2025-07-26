import React from 'react';

function JournalItem({ entry, onDeleteEntry }) {
  return (
    <div className="journal-item">
      <h3>{entry.title}</h3>
      <p>{entry.content}</p>
      <small>Created on: {new Date(entry.createdAt).toLocaleDateString()}</small>
      <button onClick={() => onDeleteEntry(entry._id)} className="delete-button">
        Delete
      </button>
    </div>
  );
}

export default JournalItem;
