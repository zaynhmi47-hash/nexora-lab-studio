export type QiblaDirection = {
  bearingDegrees: number;
  distanceKm: number;
  locationLabel: string;
  sourceLabel: string;
  calibrated: boolean;
};

export interface QiblaProvider {
  getDirection(): Promise<QiblaDirection>;
}
