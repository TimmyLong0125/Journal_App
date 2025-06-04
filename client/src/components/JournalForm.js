import React, { useState } from 'react';

function JournalForm({ onSaveEntry }) { // Receive onSaveEntry prop
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent page reload

    const newEntry = {
      id: Date.now(), // Temporary unique ID
      title,
      content,
      date,
    };

    onSaveEntry(newEntry); // Call the function passed from JournalPage

    // Clear form fields
    setTitle('');
    setContent('');
    setDate('');
  };

  return (
    <form onSubmit={handleSubmit}> {/* Call handleSubmit on form submission */}
      <h2>Create New Entry</h2>
      <div>
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required // Optional: make fields required
        />
      </div>
      <div>
        <label htmlFor="content">Content:</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required // Optional: make fields required
        />
      </div>
      <div>
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required // Optional: make fields required
        />
      </div>
      <button type="submit">Save Entry</button>
    </form>
  );
}

export default JournalForm;
