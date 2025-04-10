import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with UTC plugin
dayjs.extend(utc);

/**
 * Converts a date to UTC format for saving to the database
 * @param {Date|string} date - The date to convert (optional, defaults to current time)
 * @returns {string} - UTC formatted date string
 */
export const toUTC = (date = null) => {
  return dayjs(date || new Date()).utc().format();
};

/**
 * Formats a date for display using Intl.DateTimeFormat
 * @param {Date|string} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {string} locale - The locale to use (defaults to browser's locale)
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = { dateStyle: 'long' }, locale = navigator.language) => {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};