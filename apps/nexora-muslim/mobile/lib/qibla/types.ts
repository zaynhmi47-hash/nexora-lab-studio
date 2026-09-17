export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type QiblaDirection = {
  bearingDegrees: number;
  distanceKm: number;
  locationLabel: string;
  sourceLabel: string;
  calibrated: boolean;
  userCoordinates?: Coordinates;
  kaabaCoordinates?: Coordinates;
};

export interface QiblaProvider {
  getDirection(): Promise<QiblaDirection>;
}

export const KAABA_COORDINATES: Coordinates = {
  latitude: 21.422487,
  longitude: 39.826206,
};
