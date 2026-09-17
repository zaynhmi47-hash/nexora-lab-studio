import type { Coordinates } from './types';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => degrees * (Math.PI / 180);
const toDegrees = (radians: number) => radians * (180 / Math.PI);

export function normalizeBearing(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function calculateQiblaBearing(from: Coordinates, kaaba: Coordinates): number {
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(kaaba.latitude);
  const deltaLongitude = toRadians(kaaba.longitude - from.longitude);

  const y = Math.sin(deltaLongitude) * Math.cos(latitude2);
  const x = Math.cos(latitude1) * Math.sin(latitude2)
    - Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(deltaLongitude);

  return normalizeBearing(toDegrees(Math.atan2(y, x)));
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates): number {
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);
  const deltaLatitude = latitude2 - latitude1;
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
