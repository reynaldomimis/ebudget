import React, { useState } from "react";
import Button from "./Button";

const SubmitPlanInfoModal = ({
  isOpen,
  onClose,
  onSubmit,
  submitDisabled = false,
  showCloseIcon = true,
  title = "Submit Plan Info",
}) => {
  const [planName, setPlanName] = useState("");
  const [planDate, setPlanDate] = useState("");

  const handleSubmit = () => {
    onSubmit({ planName, planDate });
    setPlanName("");
    setPlanDate("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        {showCloseIcon && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        )}

        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}

        <div className="mb-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Date
            </label>
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={submitDisabled || !planName || !planDate}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmitPlanInfoModal;