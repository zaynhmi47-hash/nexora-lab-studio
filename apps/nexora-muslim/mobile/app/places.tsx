import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { mockIslamicPlaces, nexoraCoreIslamicPlacesRepository, type IslamicPlace, type IslamicPlacesPort } from "@/lib/places";

export default function PlacesScreen() {
  const { session } = useAuth();
  const repo = useMemo<IslamicPlacesPort>(
    () => session?.user.provider === "firebase" ? nexoraCoreIslamicPlacesRepository() : mockIslamicPlaces,
    [session],
  );
  const [places, setPlaces] = useState<IslamicPlace[]>([]);
  useEffect(() => { void repo.listPlaces().then(setPlaces).catch(() => setPlaces([])); }, [repo]);
  return (
    <Screen>
      <Text style={s.eyebrow}>ISLAMIC PLACES</Text>
      <Text style={s.heading}>Mosques & Islamic Places</Text>
      <Text style={s.muted}>A provider-ready directory for mosques, musallas, and Islamic centers.</Text>
      {places.map((place) => (
        <Card key={place.id} style={s.card}>
          <Text style={s.type}>{place.type.replace("_", " ").toUpperCase()}</Text>
          <Text style={s.title}>{place.name}</Text>
          <Text style={s.address}>{place.address}{place.city ? " · " + place.city : ""}</Text>
          <Text style={s.desc}>{place.description}</Text>
          {place.distanceKm !== null && <Text style={s.distance}>{place.distanceKm} km away</Text>}
        </Card>
      ))}
      <Text style={s.note}>Location-based search will use verified coordinates when a device location provider is connected.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs },
  card: { marginTop: spacing.md },
  type: { color: colors.primary, fontSize: 10, fontWeight: "800" },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: spacing.xs },
  address: { color: colors.textMuted, marginTop: spacing.sm },
  desc: { color: colors.textMuted, lineHeight: 20, marginTop: spacing.sm },
  distance: { color: colors.primary, fontWeight: "700", marginTop: spacing.sm },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.xl },
});
