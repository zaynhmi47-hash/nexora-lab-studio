export type IslamicPlaceType = "mosque" | "musalla" | "islamic_center";

export type IslamicPlace = {
  id: string;
  name: string;
  type: IslamicPlaceType;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  distanceKm: number | null;
};

export interface IslamicPlacesPort {
  listPlaces(options?: { latitude?: number; longitude?: number; radiusKm?: number }): Promise<IslamicPlace[]>;
}
