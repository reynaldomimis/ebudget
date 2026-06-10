import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  showCloseIcon = true,
  className = "",
  size = "medium" // small, medium, large
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: "max-w-sm",
    medium: "max-w-lg", 
    large: "max-w-2xl"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`bg-white rounded-lg shadow-lg w-full ${sizeClasses[size]} p-6 relative ${className}`}>
        {showCloseIcon && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        )}

        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
        
        {children}
      </div>
    </div>
  );
};

export default Modal;
