/**
 * Format a date value to a localized date string
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale to use (defaults to user's locale)
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = undefined) {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale);
}

/**
 * Format a date value to a localized date and time string
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale to use (defaults to user's locale)
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date, locale = undefined) {
  const dateObj = new Date(date);
  return dateObj.toLocaleString(locale);
}

/**
 * Safely format a date value, returning a fallback for invalid dates
 * @param {Date|string|number|null|undefined} date - The date to format
 * @param {string} fallback - The fallback text to show for invalid dates
 * @param {string} locale - The locale to use (defaults to user's locale)
 * @returns {string} Formatted date string or fallback
 */
export function safeFormatDate(date, fallback = 'N/A', locale = undefined) {
  // Handle null, undefined, or empty string
  if (date == null || date === '') {
    return fallback;
  }

  try {
    const dateObj = new Date(date);

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return dateObj.toLocaleDateString(locale);
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely format a date value with time, returning a fallback for invalid dates
 * @param {Date|string|number|null|undefined} date - The date to format
 * @param {string} fallback - The fallback text to show for invalid dates
 * @param {string} locale - The locale to use (defaults to user's locale)
 * @returns {string} Formatted date and time string or fallback
 */
export function safeFormatDateTime(date, fallback = 'N/A', locale = undefined) {
  // Handle null, undefined, or empty string
  if (date == null || date === '') {
    return fallback;
  }

  try {
    const dateObj = new Date(date);

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return dateObj.toLocaleString(locale);
  } catch (error) {
    return fallback;
  }
}
