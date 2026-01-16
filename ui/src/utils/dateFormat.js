/**
 * Format a date as mm/dd/yyyy
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format a date and time as mm/dd/yyyy hh:mm:ss AM/PM
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date-time string or empty string if invalid
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dateStr = formatDate(d);
  const timeStr = d.toLocaleTimeString();
  return `${dateStr} ${timeStr}`;
}
