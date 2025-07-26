import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import JournalList from '../components/JournalList';
import JournalForm from '../components/JournalForm';

function JournalPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/journal');
        if (!response.ok) {
          throw new Error('Failed to fetch entries');
        }
        const data = await response.json();
        setEntries(data);
      } catch (error) {
        console.error('Error fetching entries:', error);
      }
    };

    fetchEntries();
  }, []);

  const addEntry = async (entry) => {
    try {
      const response = await fetch('http://localhost:5001/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('Failed to save entry');
      }

      const savedEntry = await response.json();
      setEntries([savedEntry, ...entries]);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const deleteEntry = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/journal/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      setEntries(entries.filter((entry) => entry._id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  return (
    <div>
      <Header />
      <JournalForm onSaveEntry={addEntry} />
      <JournalList entries={entries} onDeleteEntry={deleteEntry} />
    </div>
  );
}

export default JournalPage;
