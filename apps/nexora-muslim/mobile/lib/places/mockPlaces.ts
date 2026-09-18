import type { IslamicPlace, IslamicPlacesPort } from "./types";

const demoPlaces: IslamicPlace[] = [
  { id: "demo-mosque-1", name: "Nexora Masjid Demo", type: "mosque", address: "Demo address", city: "Demo city", latitude: 0, longitude: 0, description: "Demo place used until a verified places source is connected.", distanceKm: null },
  { id: "demo-musalla-1", name: "Nexora Musalla Demo", type: "musalla", address: "Demo address", city: "Demo city", latitude: 0, longitude: 0, description: "Demo place used until a verified places source is connected.", distanceKm: null },
];

export const mockIslamicPlaces: IslamicPlacesPort = {
  listPlaces: async () => demoPlaces,
};
