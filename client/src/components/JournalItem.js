import React from 'react';

function JournalItem({ title, content, date }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{content}</p>
      <small>{date}</small>
    </div>
  );
}

export default JournalItem;
