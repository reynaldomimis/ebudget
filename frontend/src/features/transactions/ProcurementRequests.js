import React, { useState } from 'react';
import PRList from './PRList';
import CreatePR from './CreatePR';

const ProcurementRequests = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editId, setEditId] = useState(null);

  const handleCreateClick = () => {
    setEditId(null);
    setView('form');
  };

  const handleEditClick = (id) => {
    setEditId(id);
    setView('form');
  };

  const handleCloseForm = () => {
    setEditId(null);
    setView('list');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {view === 'list' ? (
        <PRList
          onCreateClick={handleCreateClick}
          onEditClick={handleEditClick}
        />
      ) : (
        <CreatePR
          onCancel={handleCloseForm}
          editId={editId}
        />
      )}
    </div>
  );
};

export default ProcurementRequests;
