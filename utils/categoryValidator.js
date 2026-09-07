const PREDEFINED_CATEGORIES = [
  "delivery",
  "handyman",
  "groceries",
  "transport",
  "home-cleaning",
  "errand-runner",
  "caregiver",
  "other",
];

/**
 * Sanitizes input string by removing HTML/XML tags and excess whitespace.
 * @param {string} str
 * @returns {string}
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // strip script tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // strip style tags and content
    .replace(/<[^>]+>/g, "") // strip remaining HTML tags
    .replace(/[^\p{L}\p{N}\s&/'-]/gu, "") // keep letters, numbers, spaces, and safe punctuation (&, /, ', -)
    .replace(/[\r\n\t]+/g, " ") // normalize whitespace
    .replace(/\s{2,}/g, " ") // collapse multiple spaces
    .trim();
};

/**
 * Capitalizes the first letter of each word in a string for clean presentation.
 * @param {string} str
 * @returns {string}
 */
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Validates and normalizes category input for errands.
 * Supports:
 *   - Option B: { category: "other", customCategory: "Dog Walking" }
 *   - Predefined: { category: "delivery" }
 *   - Direct custom: { category: "Dog Walking" }
 *
 * @param {string} rawCategory
 * @param {string} [rawCustomCategory]
 * @returns {{ isValid: boolean, category?: string, isCustomCategory?: boolean, error?: string }}
 */
const validateCategory = (rawCategory, rawCustomCategory) => {
  if (!rawCategory || typeof rawCategory !== "string" || !rawCategory.trim()) {
    return {
      isValid: false,
      error: "Category is required",
    };
  }

  const categoryLower = rawCategory.trim().toLowerCase();

  // Case 1: "other" selected -> must have customCategory provided
  if (categoryLower === "other") {
    if (!rawCustomCategory || typeof rawCustomCategory !== "string" || !rawCustomCategory.trim()) {
      return {
        isValid: false,
        error: "Please specify a custom category name when selecting 'Other'",
      };
    }

    const cleanedCustom = sanitizeString(rawCustomCategory);

    if (cleanedCustom.length < 2) {
      return {
        isValid: false,
        error: "Custom category name must be at least 2 characters",
      };
    }

    if (cleanedCustom.length > 50) {
      return {
        isValid: false,
        error: "Custom category name cannot exceed 50 characters",
      };
    }

    // Auto-canonicalize: check if user typed an existing predefined category
    const customLower = cleanedCustom.toLowerCase();
    const matchedPredefined = PREDEFINED_CATEGORIES.find(
      (c) => c !== "other" && c.toLowerCase() === customLower
    );

    if (matchedPredefined) {
      return {
        isValid: true,
        category: matchedPredefined,
        isCustomCategory: false,
      };
    }

    return {
      isValid: true,
      category: toTitleCase(cleanedCustom),
      isCustomCategory: true,
    };
  }

  // Case 2: Standard predefined category
  if (PREDEFINED_CATEGORIES.includes(categoryLower)) {
    return {
      isValid: true,
      category: categoryLower,
      isCustomCategory: false,
    };
  }

  // Case 3: Direct custom string passed in category field
  const cleanedDirect = sanitizeString(rawCategory);

  if (cleanedDirect.length < 2) {
    return {
      isValid: false,
      error: "Category name must be at least 2 characters",
    };
  }

  if (cleanedDirect.length > 50) {
    return {
      isValid: false,
      error: "Category name cannot exceed 50 characters",
    };
  }

  return {
    isValid: true,
    category: toTitleCase(cleanedDirect),
    isCustomCategory: true,
  };
};

module.exports = {
  PREDEFINED_CATEGORIES,
  sanitizeString,
  toTitleCase,
  validateCategory,
};
