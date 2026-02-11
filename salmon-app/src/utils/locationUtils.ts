// src/utils/locationUtils.ts

/**
 * @function getDistanceInMeters
 * @description Menghitung jarak antara dua titik koordinat geografis (latitude dan longitude) dalam meter
 *              menggunakan formula Haversine.
 * @param {number} lat1 - Latitude titik pertama.
 * @param {number} lon1 - Longitude titik pertama.
 * @param {number} lat2 - Latitude titik kedua.
 * @param {number} lon2 - Longitude titik kedua.
 * @returns {number} Jarak antara dua titik dalam meter.
 */
export const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}

/**
 * @function formatDistance
 * @description Memformat jarak dari meter ke format yang lebih mudah dibaca (meter atau kilometer).
 * @param {number} meters - Jarak dalam meter.
 * @returns {string} Jarak yang diformat (misalnya, "150 meter" atau "1.2 km").
 */
export const formatDistance = (meters: number): string => {
    if (meters < 500) {
        return `${Math.round(meters)} meter`;
    } else {
        const kilometers = meters / 1000;
        return `${kilometers.toFixed(1)} km`;
    }
};
