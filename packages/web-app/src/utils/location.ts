/**
 * Location utilities for working with geographic coordinates
 */

export interface Coordinates {
  lat: number;
  long: number;
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      error => {
        reject(error);
      }
    );
  });
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.long >= -180 &&
    coords.long <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  const latDir = coords.lat >= 0 ? 'N' : 'S';
  const lngDir = coords.long >= 0 ? 'E' : 'W';
  return `${Math.abs(coords.lat).toFixed(6)}°${latDir}, ${Math.abs(coords.long).toFixed(6)}°${lngDir}`;
}
