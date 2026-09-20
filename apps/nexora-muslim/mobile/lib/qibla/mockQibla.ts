import type { QiblaDirection, QiblaProvider } from './types';

export const mockQiblaDirection: QiblaDirection = {
  bearingDegrees: 292,
  distanceKm: 7420,
  locationLabel: 'Current location',
  sourceLabel: 'Demo direction',
  calibrated: false,
};

export const mockQiblaProvider: QiblaProvider = {
  async getDirection() {
    return mockQiblaDirection;
  },
};
