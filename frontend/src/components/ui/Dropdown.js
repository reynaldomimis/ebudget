import React, { useState, useRef, useEffect } from "react";

const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  size = "medium",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const [alignRight, setAlignRight] = useState(false); // new state

  const sizeStyles = {
    small: "h-8 px-3 text-xs",
    medium: "h-9 px-3.5 text-sm",
    large: "h-10 px-4 text-base",
  };

  // Measure button width and viewport overflow
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonWidth(rect.width);

      // Check if the dropdown would overflow right
      const spaceRight = window.innerWidth - rect.left;
      setAlignRight(spaceRight < 220); // adjust 220px for dropdown width
    }
  }, [value, options, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2
          min-w-[120px] max-w-full
          border border-gray-300 rounded-md
          bg-white text-gray-900
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
          transition-colors
          ${sizeStyles[size] || sizeStyles.medium}
          ${disabled 
            ? "opacity-60 cursor-not-allowed bg-gray-50" 
            : "hover:border-gray-400 hover:bg-gray-50/80 active:bg-gray-100"
          }
        `}
      >
        <span 
          className="truncate flex-1 text-left font-medium"
          title={selected?.label || placeholder} // tooltip on hover
        >
          {selected?.label || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden ${
            alignRight ? "right-0" : "left-0"
          }`}
          style={{
            minWidth: buttonWidth ? `${buttonWidth}px` : "140px",
            maxWidth: "min(90vw, 420px)",
          }}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  transition-colors duration-100
                  hover:bg-green-50 focus:bg-green-50 focus:outline-none
                  ${option.value === value 
                    ? "bg-green-50 text-green-700 font-medium" 
                    : "text-gray-800"
                  }
                `}
                title={option.label}
              >
                <span className="truncate block">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;