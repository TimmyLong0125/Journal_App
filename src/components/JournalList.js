import React from 'react';
import JournalItem from './JournalItem';

function JournalList({ entries }) {
  return (
    <div>
      <h2>Journal List</h2>
      {entries.map(entry => (
        <JournalItem
          key={entry.id}
          title={entry.title}
          content={entry.content}
          date={entry.date}
        />
      ))}
    </div>
  );
}

export default JournalList;
