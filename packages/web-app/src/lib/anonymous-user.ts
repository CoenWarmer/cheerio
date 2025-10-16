/**
 * Utility functions for managing anonymous user state in the browser
 * Uses localStorage to persist anonymous user ID across sessions
 */

const ANONYMOUS_ID_KEY = 'cheerio_anonymous_id';
const ANONYMOUS_NAME_KEY = 'cheerio_anonymous_name';

export const anonymousUserStorage = {
  /**
   * Get the anonymous user ID from localStorage
   * Returns null if not set
   */
  getId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ANONYMOUS_ID_KEY);
  },

  /**
   * Set the anonymous user ID in localStorage
   */
  setId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  },

  /**
   * Remove the anonymous user ID from localStorage
   */
  removeId(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ANONYMOUS_ID_KEY);
  },

  /**
   * Get the anonymous user's display name from localStorage
   * Returns null if not set
   */
  getName(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ANONYMOUS_NAME_KEY);
  },

  /**
   * Set the anonymous user's display name in localStorage
   */
  setName(name: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ANONYMOUS_NAME_KEY, name);
  },

  /**
   * Remove the anonymous user's display name from localStorage
   */
  removeName(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ANONYMOUS_NAME_KEY);
  },

  /**
   * Clear all anonymous user data from localStorage
   */
  clear(): void {
    this.removeId();
    this.removeName();
  },

  /**
   * Check if user is currently anonymous (has ID but no auth session)
   */
  isAnonymous(): boolean {
    return this.getId() !== null;
  },
};
