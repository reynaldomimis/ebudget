// program map: keys = main program, values = array of sub-programs
export const programMap = {
  "GENERAL ADMINISTRATION AND SUPPORT": [
    "General Management and Supervision",
    "Human Resource Development",
  ],
  "NATIONAL NUTRITION MANAGEMENT PROGRAM": [
    "Nutrition policy, standards, plans and program development and coordination",
    "Philippine food and nutrition surveillance",
    "Promotion of good nutrition",
    "Assistance to national, local nutrition and related programs",
  ],
};

// List of office names
export const officeNames = [
  "AD",
  "OED",
  "DED-TS",
  "DEF-FS",
  "NPPD",
  "NSD",
  "NIED",
  "FMD",
];

// Helper function to get key from label
export const getKeyFromLabel = (label) => {
  if (!label) return "";

  switch (label.trim()) {
    case "GENERAL ADMINISTRATION AND SUPPORT":
      return "GAS";

    case "General Management and Supervision":
      return "GMS";

    case "Human Resource Development":
      return "HRD";

    case "Nutrition policy, standards, plans and program development and coordination":
      return "POLICY";

    case "Philippine food and nutrition surveillance":
      return "PFNSS";

    case "Promotion of good nutrition":
      return "PGN";

    case "Assistance to national, local nutrition and related programs":
      return "ASSISTANCE";

    case "GRAND TOTAL":
      return "GRAND TOTAL";

    case "TOTAL":
      return "TOTAL";

    default:
      return label;
  }
};
//Helper object column in table
export const columnConfig = [
  {
    key: "office",
    label: "OFFICE",
    width: "65px",
    align: "center",
    textColor: "red",
    fontWeight: "bold",
  },
  { key: "name", label: "NAME", width: "180px", align: "left" },
  {
    key: "performance_indicator",
    label: "PERFORMANCE",
    width: "150px",
    align: "left",
  },
  { key: "pt1", label: "PT1", width: "40px", align: "center" },
  { key: "pt2", label: "PT2", width: "40px", align: "center" },
  { key: "pt3", label: "PT3", width: "40px", align: "center" },
  { key: "pt4", label: "PT4", width: "40px", align: "center" },
  { key: "totalPt", label: "TOTAL", width: "45px", align: "center" },
  {
    key: "expense_items",
    label: "EXPENSE ITEMS",
    width: "160px",
    align: "left",
  },
  {
    key: "expense_items_sub",
    label: "EXPENSE SUB‑ITEMS",
    width: "160px",
    align: "left",
  },
  { key: "fq1", label: "Q1", width: "80px", align: "right" },
  { key: "fq2", label: "Q2", width: "80px", align: "right" },
  { key: "fq3", label: "Q3", width: "80px", align: "right" },
  { key: "fq4", label: "Q4", width: "80px", align: "right" },
  {
    key: "totalFq",
    label: "TOTAL FQ",
    width: "95px",
    align: "right",
    fontWeight: "bold",
    paddingRight: "8px",
  },
];

//Columns for PROBligation table
export const tableColumns = {
  "PR/SO": [
    "PRNO",
    "DATE",
    "AMOUNT PR",
    "OBLIGATED",
    "UNOBLIGATED",
    "BALANCE PR",
  ],
  OBLIGATION: [
    "OBRNO",
    "PRNO",
    "PARTICULAR",
    "DATE",
    "OBLIGATED",
    "UNOBLIGATED",
  ],
};
// Returns true if the name matches any subtotal/ceiling/total keyword, false otherwise
export const isSubTotalName = (name) => {
  if (!name) return false;

  const keywords = [
    "Sub-total, GMS, MOOE",
    "Sub-total, GMS, CO",
    "Ceiling, GSM",
    "Difference",
    "Sub-total, HRD, MOOE",
    "Ceiling, HRD",
    "Sub-total, General Management and Supervision (PS)",
    "Sub-total, Administration of Personnel Benefits (PS)",
    "TOTAL, PS",
    "TOTAL GSM, MOOE",
    "TOTAL GSM, CO",
    "CEILING, MOOE",
    "CEILING, CO",
    "Difference MOOE",
    "Difference CO",
    "TOTAL, MOOE",
    "GRAND TOTAL, PS",
    "GRAND TOTAL, RLIP",
    "GRAND TOTAL, CO",
    "GRAND TOTAL, MOOE",
  ];

  const normalize = (str) =>
    String(str ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  return keywords.some((keyword) => normalize(name) === normalize(keyword));
};

// Removes numbering prefixes like 1., 1.2, a., b., i., ii. from the start of a string
export const removeNumberingPrefix = (name) => {
  if (!name) return "";

  return name
    // 1. Tanggalin ang hierarchical numbers (1., 1.1) na sinusundan ng space
    .replace(/^(\d+(\.\d+)*)\.?\s+/, "")
    // 2. Tanggalin ang alphabetical/roman prefixes (a., b., i.) - kahit walang space o may dot/parenthesis
    .replace(/^([a-z]|[ivx]+)[\.\)]\s*/i, "")
    // 3. Tanggalin ang leading dashes o bullets
    .replace(/^[-•]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Returns the previous row's value for a given key or null if first row
export const getPreviousRowValue = (rows, index, key) =>
  index > 0 ? (rows[index - 1]?.[key] ?? null) : null;

// Returns the matched string based on type ('key' or 'value'), else null
export const matchProgram = (input, type) => {
  if (!type || !programMap) return null;

  // Robust normalization
  const normalize = (v) =>
    String(v ?? "")
      .toLowerCase()
      .trim();

  const target = normalize(input);

  // Skip empty inputs early
  if (!target) return null;

  for (const [key, values] of Object.entries(programMap)) {
    if (type === "key" && normalize(key) === target) {
      return key;
    }
    if (
      type === "value" &&
      Array.isArray(values) &&
      values.some((v) => normalize(v) === target)
    ) {
      return input;
    }
  }
  return null;
};

// Generic validator for multiple fields: inherits only if under same pap_type and pap_des
export const getValidatedRowValuesDynamic = (
  papType,
  papDesCandidate,
  rowData,
  prevRow,
  fieldsToValidate = [],
) => {
  // Validate pap_des first
  let papDes = "";
  if (papDesCandidate && programMap[papType]?.includes(papDesCandidate)) {
    papDes = papDesCandidate;
  } else if (
    prevRow.pap_type === papType &&
    prevRow.pap_des &&
    programMap[papType]?.includes(prevRow.pap_des)
  ) {
    papDes = prevRow.pap_des;
  }

  const result = { papDes, papType };

  fieldsToValidate.forEach((field) => {
    const value = rowData[field] ?? "";
    // inherit previous only if same pap_type and pap_des
    if (!value && prevRow.pap_type === papType && prevRow.pap_des === papDes) {
      result[field] = prevRow[field] ?? "";
    } else {
      result[field] = value;
    }
  });

  return result;
};

// Returns the hierarchy level based on the leading numeric pattern (e.g., "1.2.3" → 3)
export const getHierarchyLevel = (name) => {
  if (!name || typeof name !== "string") return 0;

  const prefixMatch = name.trim().match(/^(\d+(\.\d+)*)\.?\s+/);
  if (!prefixMatch) return 0;

  const prefix = prefixMatch[1];
  const segments = prefix.split(".").filter((s) => s !== "");

  return segments.length;
};

//Safely get string from any value
export const safeString = (v) =>
  v !== null && v !== undefined ? v.toString() : "";

//Cleans string: removes line breaks, extra spaces, and trims
export const cleanString = (value) => {
  return (value || "")
    .toString()
    .replace(/\r?\n/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};
