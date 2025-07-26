import React from 'react';
import JournalItem from './JournalItem';

function JournalList({ entries, onDeleteEntry }) {
  return (
    <div>
      <h2>My Journal</h2>
      {entries.length > 0 ? (
        entries.map(entry => (
          <JournalItem key={entry._id} entry={entry} onDeleteEntry={onDeleteEntry} />
        ))
      ) : (
        <p>No entries yet. Create one above!</p>
      )}
    </div>
  );
}

export default JournalList;
