import React, { useState } from 'react';
import ObligationList from './ObligationList';
import CreateObligation from './CreateObligation';

const Obligations = () => {
  const [view, setView] = useState('list');

  const handleCreateClick = () => {
    setView('create');
  };

  const handleCancelCreate = () => {
    setView('list');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {view === 'list' ? (
        <ObligationList onCreateClick={handleCreateClick} />
      ) : (
        <CreateObligation onCancel={handleCancelCreate} />
      )}
    </div>
  );
};

export default Obligations;
