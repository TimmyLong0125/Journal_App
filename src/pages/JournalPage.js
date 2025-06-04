import React, { useState } from 'react';
import Header from '../components/Header';
import JournalList from '../components/JournalList';
import JournalForm from '../components/JournalForm';

function JournalPage() {
  const [entries, setEntries] = useState([
    { id: 1, title: 'My First Day Learning React', content: 'It was challenging but fun!', date: '2025-06-01' },
    { id: 2, title: 'Understanding Components', content: 'Breaking down the UI makes sense.', date: '2025-06-02' }
  ]);

  const addEntry = (newEntry) => {
    setEntries([newEntry, ...entries]); // Adds new entry to the beginning of the list
  };

  return (
    <div>
      <Header />
      <JournalForm onSaveEntry={addEntry} />
      <JournalList entries={entries} />
    </div>
  );
}

export default JournalPage;
