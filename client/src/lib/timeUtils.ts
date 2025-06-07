/**
 * Utility functions for handling timezone conversions and time formatting
 */

/**
 * Format a timestamp to local time with timezone awareness
 */
export const formatTimestampToLocal = (timestamp: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(timestamp);
  
  // Default options for time display
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  return date.toLocaleTimeString([], formatOptions);
};

/**
 * Format a timestamp to local date with timezone awareness
 */
export const formatDateToLocal = (timestamp: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(timestamp);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  return date.toLocaleDateString([], formatOptions);
};

/**
 * Get user's timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert UTC timestamp to user's local timezone and format
 */
export const formatCompletionTime = (timestamp: string): string => {
  // DEBUG: Log the timestamp being formatted
  console.log('formatCompletionTime received timestamp:', timestamp);
  
  // If timestamp ends with 'Z', it's already in UTC and needs local conversion
  if (timestamp.endsWith('Z')) {
    const date = new Date(timestamp);
    console.log('formatCompletionTime parsed UTC date:', date);
    const result = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    console.log('formatCompletionTime UTC formatted result:', result);
    return result;
  }
  
  // If timestamp doesn't end with 'Z', treat it as local time
  // Parse it as UTC then subtract timezone offset to get correct local display
  const utcDate = new Date(timestamp + 'Z');
  const localDate = new Date(utcDate.getTime() - (new Date().getTimezoneOffset() * 60000));
  
  console.log('formatCompletionTime parsed as local:', localDate);
  const result = localDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  console.log('formatCompletionTime local formatted result:', result);
  return result;
};

/**
 * Format timestamp for display with relative time context
 */
export const formatTimestampWithContext = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timestampDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const isToday = timestampDate.getTime() === today.getTime();
  
  if (isToday) {
    return `Today at ${formatCompletionTime(timestamp)}`;
  } else {
    return `${formatDateToLocal(timestamp, { month: 'short', day: 'numeric' })} at ${formatCompletionTime(timestamp)}`;
  }
};

/**
 * Get today's date in local timezone as YYYY-MM-DD format
 */
export const getTodayLocalDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get minimum date for date picker (today in local timezone)
 */
export const getMinDateForPicker = (): string => {
  return getTodayLocalDate();
};

/**
 * Convert date string to local timezone date object
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Check if a date string represents today in local timezone
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayLocalDate();
};

/**
 * Format date for habit form default value (local timezone)
 */
export const formatDateForForm = (date?: Date): string => {
  const targetDate = date || new Date();
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};