import type { IslamicPlace, IslamicPlacesPort } from "./types";

const baseUrl = process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? "http://localhost:8000";

export const nexoraCoreIslamicPlacesRepository = (): IslamicPlacesPort => ({
  listPlaces: async (options) => {
    const params = new URLSearchParams();
    if (options?.latitude !== undefined && options?.longitude !== undefined) {
      params.set("lat", String(options.latitude));
      params.set("lng", String(options.longitude));
      params.set("radiusKm", String(options.radiusKm ?? 25));
      if (options.type) params.set("type", options.type);
    }
    const query = params.toString();
    const response = await fetch(baseUrl + "/api/v1/places/" + (query ? "?" + query : ""), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Islamic places request failed (" + response.status + ").");
    return await response.json() as IslamicPlace[];
  },
});
