/**
 * DataNormalizationEngine
 * Centralized service for normalizing and deduplicating dropdown values.
 * Handles case sensitivity, extra spaces, and near-duplicate detection.
 */
class DataNormalizationEngine {
  /**
   * Cleans formatting issues from imported labels (e.g., leading dashes)
   */
  static cleanLabel(str) {
    if (!str) return '';
    return str
      .toString()
      .trim()
      .replace(/^[-–—]\s*/, '') // Remove leading hyphen, en-dash, or em-dash followed by optional space
      .trim();
  }

  /**
   * Normalizes a single string for comparison
   */
  static normalize(str) {
    if (!str) return '';
    return this.cleanLabel(str)
      .replace(/\s+/g, ' ') // Replace multiple spaces with one
      .toLowerCase();
  }

  /**
   * Smartly deduplicates an array of strings
   * Returns unique strings while preserving the most 'professional' case (usually Title Case or Upper)
   */
  static smartDeduplicate(items) {
    if (!Array.isArray(items)) return [];

    const uniqueMap = new Map();

    items.forEach(item => {
      if (!item) return;

      const cleanedValue = this.cleanLabel(item);
      if (!cleanedValue) return;

      const normalized = cleanedValue.replace(/\s+/g, ' ').toLowerCase();

      // Basic near-duplicate cleanup (e.g., 'Services' vs 'Service')
      const simplified = normalized.replace(/s\b/g, ''); // Crude singularization for comparison

      if (!uniqueMap.has(simplified)) {
        uniqueMap.set(simplified, cleanedValue);
      } else {
        // If we already have it, prefer the one with better casing (more uppercase letters usually means more 'official')
        const existing = uniqueMap.get(simplified);
        const existingUpperCount = (existing.match(/[A-Z]/g) || []).length;
        const currentUpperCount = (cleanedValue.match(/[A-Z]/g) || []).length;

        if (currentUpperCount > existingUpperCount) {
          uniqueMap.set(simplified, cleanedValue);
        }
      }
    });

    return Array.from(uniqueMap.values()).sort();
  }

  /**
   * Calculates similarity between two strings (0 to 1)
   * Simple Jaccard similarity for speed and reliability in dropdowns
   */
  static getSimilarity(s1, s2) {
    const n1 = this.normalize(s1);
    const n2 = this.normalize(s2);

    if (n1 === n2) return 1.0;
    if (n1.length === 0 || n2.length === 0) return 0.0;

    const set1 = new Set(n1.split(''));
    const set2 = new Set(n2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}

export default DataNormalizationEngine;
