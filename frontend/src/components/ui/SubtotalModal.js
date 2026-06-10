import React, { useState, useEffect, useRef } from "react";
import {
  formatAmountWithCursor,
  formatPHP,
  parsePHP,
} from "../../utils/formatters";
import { toast } from "react-toastify";
import { activitiesAPI } from "../../utils/api";

const SubtotalModal = ({ isOpen, onClose, selectedSubtotal, onSubmit }) => {
  const [amount, setAmount] = useState(selectedSubtotal?.totalFq || 0);
  const amountRef = useRef(null);

  // Update when selectedSubtotal changes
  useEffect(() => {
    setAmount(formatPHP(selectedSubtotal?.totalFq || 0));
  }, [selectedSubtotal]);

  if (!isOpen) return null;

  // Realtime formatted input
  const handleAmountChange = (value) => {
    if (amountRef.current) {
      const cursorPos = amountRef.current.selectionStart;
      const { formatted, cursorPosition } = formatAmountWithCursor(
        value,
        cursorPos,
      );

      // Prepend peso sign for display
      const formattedWithPeso = formatted ? `${formatted}` : "";

      setAmount(formattedWithPeso);

      // Restore cursor (skip the peso sign in cursor)
      setTimeout(() => {
        const pos = cursorPosition + 1; // +1 for the peso sign
        amountRef.current.setSelectionRange(pos, pos);
      }, 0);
    } else {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    const numericAmount = parsePHP(amount);

    if (!numericAmount || numericAmount <= 0) {
      toast.warning("Amount is required and must be greater than zero.");
      return;
    }

    try {
      await activitiesAPI.updateTotalFq(selectedSubtotal.id, numericAmount);

      //update parent/local state
      if (onSubmit) {
        onSubmit({
          ...selectedSubtotal,
          totalFq: numericAmount,
        });
      }

      toast.success("Total FQ updated successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update totalFq");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow-lg w-96 p-4">
        <h2 className="text-lg font-bold mb-3">Edit Subtotal</h2>

        <div className="mb-3 text-sm text-gray-700">
          <strong>Subtotal for:</strong>
          <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
            {selectedSubtotal?.sub_total_name || "Subtotal"}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            ref={amountRef}
            type="text"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-right"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtotalModal;
