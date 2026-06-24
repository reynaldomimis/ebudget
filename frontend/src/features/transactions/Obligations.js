import React, { useState } from 'react';
import ObligationList from './ObligationList';
import CreateObligation from './CreateObligation';

const Obligations = () => {
  const [view, setView] = useState('list');
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
        <ObligationList
          onCreateClick={handleCreateClick}
          onEditClick={handleEditClick}
        />
      ) : (
        <CreateObligation
          onCancel={handleCloseForm}
          editId={editId}
        />
      )}
    </div>
  );
};

export default Obligations;
