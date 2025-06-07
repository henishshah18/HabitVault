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
  // Ensure the timestamp is treated as UTC if it doesn't have timezone info
  let utcTimestamp = timestamp;
  if (!timestamp.endsWith('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
    utcTimestamp = timestamp + 'Z';
  }
  
  const date = new Date(utcTimestamp);
  
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
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