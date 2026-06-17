import React, { useState } from 'react';
import PRList from './PRList';
import CreatePR from './CreatePR';

const ProcurementRequests = () => {
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
        <PRList onCreateClick={handleCreateClick} />
      ) : (
        <CreatePR onCancel={handleCancelCreate} />
      )}
    </div>
  );
};

export default ProcurementRequests;
