import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import JournalList from '../components/JournalList';
import JournalForm from '../components/JournalForm';
import Search from '../components/Search'; // Import the Search component
import TherapistChat from '../components/TherapistChat';

function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // To track search state

  const fetchEntries = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/journal', { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      const data = await response.json();
      setEntries(data);
      setIsSearching(false); // Reset search state
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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

  const handleSearch = async (query) => {
    try {
      const response = await fetch('http://localhost:5001/api/journal/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setEntries(data.results);
      setIsSearching(true); // We are now displaying search results
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  return (
    <div>
      <Header />
      <JournalForm onSaveEntry={addEntry} />
      <Search onSearch={handleSearch} />
      {isSearching && <button onClick={fetchEntries}>Clear Search</button>}
      <TherapistChat />
      <JournalList entries={entries} onDeleteEntry={deleteEntry} />
    </div>
  );
}

export default JournalPage;
