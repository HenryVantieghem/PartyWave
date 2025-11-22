import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request location permissions from the user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to show you nearby parties. You can change this in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
};

/**
 * Get the user's current location
 */
export const getCurrentLocation = async (): Promise<Coordinates | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Get location error:', error);
    Alert.alert('Error', 'Failed to get your location. Please try again.');
    return null;
  }
};

/**
 * Calculate distance between two coordinates using the Haversine formula
 * Returns distance in miles
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 */
export const formatDistance = (miles: number): string => {
  if (miles < 0.1) {
    return '< 0.1 mi';
  } else if (miles < 1) {
    return `${miles.toFixed(1)} mi`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles)} mi`;
  }
};

/**
 * Get parties sorted by distance from user's location
 */
export const sortPartiesByDistance = <T extends { latitude?: number; longitude?: number }>(
  parties: T[],
  userLocation: Coordinates
): (T & { distance: number })[] => {
  return parties
    .map((party) => {
      if (!party.latitude || !party.longitude) {
        return { ...party, distance: Infinity };
      }

      const distance = calculateDistance(userLocation, {
        latitude: party.latitude,
        longitude: party.longitude,
      });

      return { ...party, distance };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Filter parties within a certain radius (in miles)
 */
export const filterPartiesByRadius = <T extends { latitude?: number; longitude?: number }>(
  parties: T[],
  userLocation: Coordinates,
  radiusMiles: number
): T[] => {
  return parties.filter((party) => {
    if (!party.latitude || !party.longitude) {
      return false;
    }

    const distance = calculateDistance(userLocation, {
      latitude: party.latitude,
      longitude: party.longitude,
    });

    return distance <= radiusMiles;
  });
};

/**
 * Watch user's location for real-time updates
 */
export const watchLocation = async (
  callback: (location: Coordinates) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Update every 50 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Watch location error:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (
  coordinates: Coordinates
): Promise<string | null> => {
  try {
    const [result] = await Location.reverseGeocodeAsync(coordinates);

    if (!result) return null;

    // Format address
    const parts = [];
    if (result.name) parts.push(result.name);
    if (result.street) parts.push(result.street);
    if (result.city) parts.push(result.city);
    if (result.region) parts.push(result.region);

    return parts.join(', ') || null;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
};

/**
 * Geocode address to get coordinates
 */
export const geocodeAddress = async (
  address: string
): Promise<Coordinates | null> => {
  try {
    const results = await Location.geocodeAsync(address);

    if (results.length === 0) return null;

    const [result] = results;
    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
};
