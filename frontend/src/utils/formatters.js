// PHP Currency Formatting with PHP Symbol
// export const formatPHP = (amount) => {
//   const num = parseFloat(amount) || 0;
//   return new Intl.NumberFormat('en-PH', {
//     style: 'currency',
//     currency: 'PHP',
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   }).format(num);
// };
export const formatPHP = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Parse PHP formatted amount back to number safely
export const parsePHP = (formattedAmount) => {
  if (formattedAmount == null) return 0;
  // Convert to string first in case it's already a number
  const cleaned = String(formattedAmount).replace(/[₱,]/g, "");
  return parseFloat(cleaned) || 0;
};

// Format amount with real-time cursor position support
export const formatAmountWithCursor = (value, cursorPosition) => {
  if (!value) return { formatted: "", cursorPosition: 0 };

  // 1. Panatilihin ang decimal point habang nagta-type ang user
  let cleanValue = value.replace(/[^\d.]/g, "");

  // 2. Handle multiple decimal points
  const parts = cleanValue.split(".");
  if (parts.length > 2) {
    cleanValue = parts[0] + "." + parts.slice(1).join("");
  }

  // 3. I-format ang value
  let formatted;
  // Kung nagtatapos sa '.', hayaan ang user na i-type ang decimal
  if (cleanValue.endsWith(".")) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formatted = integerPart + ".";
  } else {
    // I-format ang number (wala pang .00 dito kung integer)
    const num = parseFloat(cleanValue);
    formatted = new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // 4. Calculate new cursor position
  // (Pinanatili ang iyong logic para sa cursor)
  let newCursorPosition = cursorPosition;
  const numericOnly = value.replace(/[^\d]/g, "");
  const formattedNumeric = formatted.replace(/[^\d]/g, "");

  if (numericOnly.length <= formattedNumeric.length) {
    newCursorPosition = cursorPosition;
  } else {
    newCursorPosition = formatted.length;
  }

  return { formatted, cursorPosition: newCursorPosition };
};

// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

//Back to default date
export const toInputDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return ""; // fallback if invalid
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Word wrap for table cells
export const wordWrap = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;

  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines.join("\n");
};

// Export to Excel helper
export const exportToExcel = (data, filename) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Debounce utility for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone utility
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate email format
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncate text with ellipsis
export const truncate = (str, maxLength) => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
};

//  ConvertToThousands
export const convertToThousands = (value) => {
  // ✅ handle null, undefined, empty string, whitespace
  if (value === null || value === undefined || String(value).trim() === "") {
    return "0.00";
  }

  // ✅ remove commas and parse
  const parsed = Number(String(value).replace(/,/g, ""));

  // ✅ handle NaN / Infinity
  if (!isFinite(parsed)) {
    return "0.00";
  }

  const multiplied = parsed * 1000;

  return multiplied.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

//For MySQL DECIMAL / BIGDECIMAL (returns NUMBER)
export const convertToThousandsNumber = (value) => {
  // handle null, undefined, empty, whitespace
  if (value === null || value === undefined || String(value).trim() === "") {
    return 0;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  if (!isFinite(parsed)) {
    return 0;
  }

  // multiply ONLY, no formatting
  return Number((parsed * 1000).toFixed(2));
};

// Left → right deduction of fq1 to fq4
export const deductFromFqs = (row, obligatedAmount) => {
  let remaining = parsePHP(obligatedAmount);
  const updatedRow = { ...row };

  for (const key of ["fq1", "fq2", "fq3", "fq4"]) {
    if (remaining <= 0) break;

    const current = parsePHP(updatedRow[key]);
    if (current >= remaining) {
      updatedRow[key] = current - remaining;
      remaining = 0;
    } else {
      updatedRow[key] = 0;
      remaining = remaining - current;
    }
  }

  // recompute totalFq SAFELY (all numbers)
  updatedRow.totalFq =
    parsePHP(updatedRow.fq1) +
    parsePHP(updatedRow.fq2) +
    parsePHP(updatedRow.fq3) +
    parsePHP(updatedRow.fq4);

  return {
    ...updatedRow,
    remainingObligation: remaining,
  };
};
