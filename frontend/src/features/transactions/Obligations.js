import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ObligationList from './ObligationList';
import CreateObligation from './CreateObligation';

const Obligations = () => {
  const location = useLocation();
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [initialPrNo, setInitialPrNo] = useState(null);

  useEffect(() => {
    // Check if we arrived here with a PR Number from the Approval Queue
    if (location.state && location.state.prno) {
      setInitialPrNo(location.state.prno);
      setView('form');
      setEditId(null);
    }
  }, [location]);

  const handleCreateClick = () => {
    setEditId(null);
    setInitialPrNo(null);
    setView('form');
  };

  const handleEditClick = (id) => {
    setEditId(id);
    setInitialPrNo(null);
    setView('form');
  };

  const handleCloseForm = () => {
    setEditId(null);
    setInitialPrNo(null);
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
          prNo={initialPrNo}
        />
      )}
    </div>
  );
};

export default Obligations;
