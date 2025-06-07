/**
 * Utility functions for managing user preferences in localStorage
 * All preferences are scoped to the authenticated user
 */

interface UserPreferences {
  darkMode: boolean;
  motivationalQuotes: boolean;
  analyticsTimeRange: 'week' | 'month';
  lastLoginUserId?: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: false,
  motivationalQuotes: true,
  analyticsTimeRange: 'month'
};

// Generate a storage key scoped to the user
const getUserStorageKey = (userId: number, key: string): string => {
  return `habitvault_user_${userId}_${key}`;
};

// Get user preferences for the authenticated user
export const getUserPreferences = (userId: number): UserPreferences => {
  try {
    const storageKey = getUserStorageKey(userId, 'preferences');
    const stored = localStorage.getItem(storageKey);
    
    console.log('Loading preferences:', { userId, storageKey, stored });
    
    if (stored) {
      const parsed = JSON.parse(stored);
      const result = { ...DEFAULT_PREFERENCES, ...parsed };
      console.log('Loaded preferences:', result);
      return result;
    }
    
    console.log('No stored preferences found, using defaults:', DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

// Save user preferences for the authenticated user
export const saveUserPreferences = (userId: number, preferences: Partial<UserPreferences>): void => {
  try {
    const storageKey = getUserStorageKey(userId, 'preferences');
    
    // Get current stored preferences directly from localStorage to avoid recursion
    let current = DEFAULT_PREFERENCES;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        current = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch (parseError) {
        console.warn('Failed to parse stored preferences, using defaults');
      }
    }
    
    const updated = { ...current, ...preferences };
    
    console.log('Saving preferences:', { userId, storageKey, current, preferences, updated });
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Verify it was saved
    const saved = localStorage.getItem(storageKey);
    console.log('Verification - saved value:', saved);
    
    console.log('Preferences saved to localStorage successfully');
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};

// Update a specific preference and notify components
export const updateUserPreference = <K extends keyof UserPreferences>(
  userId: number,
  key: K,
  value: UserPreferences[K]
): void => {
  saveUserPreferences(userId, { [key]: value });
  
  // Dispatch custom event to notify components of preference changes
  window.dispatchEvent(new CustomEvent('userPreferenceChanged', {
    detail: { userId, key, value }
  }));
};

// Clear all user data from localStorage (for logout)
export const clearUserData = (userId: number): void => {
  try {
    const keys = Object.keys(localStorage);
    const userPrefix = `habitvault_user_${userId}_`;
    
    keys.forEach(key => {
      if (key.startsWith(userPrefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
};

// Get current user ID from localStorage
export const getCurrentUserId = (): number | null => {
  try {
    const storedUserId = localStorage.getItem('userId');
    return storedUserId ? parseInt(storedUserId) : null;
  } catch (error) {
    console.error('Failed to get current user ID:', error);
    return null;
  }
};

// Initialize user preferences on login
export const initializeUserPreferences = (userId: number): UserPreferences => {
  const preferences = getUserPreferences(userId);
  
  console.log('Initializing user preferences:', preferences);
  
  // Apply dark mode immediately
  if (preferences.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  return preferences;
};