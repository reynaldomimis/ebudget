class DataNormalizationEngine {
  /**
   * Normalizes labels by removing formatting noise while preserving business hierarchy markers.
   * Rules:
   * 1. Preserve hierarchy markers like "a.", "1.", "I."
   * 2. Remove leading dashes/bullets like "- " or "— "
   * 3. Trim extra spaces and remove duplicated whitespace
   */
  static normalizeLabel(label) {
    if (!label || typeof label !== 'string') return label || "";

    let normalized = label.trim();

    // Remove leading dashes/bullets (- or —) and subsequent whitespace
    // We use a regex that matches start of string, followed by - or —
    normalized = normalized.replace(/^[-\u2014]\s*/, "");

    // Remove duplicated whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }
}

module.exports = DataNormalizationEngine;
