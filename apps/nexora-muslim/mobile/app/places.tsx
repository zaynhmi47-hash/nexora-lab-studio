import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { mockIslamicPlaces, nexoraCoreIslamicPlacesRepository, type IslamicPlace, type IslamicPlaceType, type IslamicPlacesPort } from "@/lib/places";

const filters: Array<{ key: "all" | IslamicPlaceType; label: string }> = [
  { key: "all", label: "All" }, { key: "mosque", label: "Mosques" }, { key: "musalla", label: "Musalla" }, { key: "islamic_center", label: "Islamic centers" },
];

export default function PlacesScreen() {
  const { session } = useAuth();
  const repo = useMemo<IslamicPlacesPort>(() => session?.user.provider === "firebase" ? nexoraCoreIslamicPlacesRepository() : mockIslamicPlaces, [session]);
  const [places, setPlaces] = useState<IslamicPlace[]>([]);
  const [filter, setFilter] = useState<"all" | IslamicPlaceType>("all");

  useEffect(() => {
    let active = true;
    void repo.listPlaces(filter === "all" ? undefined : { type: filter }).then((value) => { if (active) setPlaces(value); }).catch(() => { if (active) setPlaces([]); });
    return () => { active = false; };
  }, [repo, filter]);

  const openDirections = (place: IslamicPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    void Linking.openURL(url);
  };

  return (
    <Screen>
      <Text style={s.eyebrow}>ISLAMIC PLACES</Text>
      <Text style={s.heading}>Mosques & Islamic Places</Text>
      <Text style={s.muted}>Browse verified directory entries and open directions in your maps app.</Text>
      <View style={s.filters}>{filters.map((item) => <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[s.filter, filter === item.key && s.filterActive]}><Text style={filter === item.key ? s.filterTextActive : s.filterText}>{item.label}</Text></Pressable>)}</View>
      {places.map((place) => (
        <Card key={place.id} style={s.card}>
          <Text style={s.type}>{place.type.replace("_", " ").toUpperCase()}</Text>
          <Text style={s.title}>{place.name}</Text>
          <Text style={s.address}>{place.address}{place.city ? " · " + place.city : ""}</Text>
          <Text style={s.desc}>{place.description}</Text>
          {place.distanceKm !== null && <Text style={s.distance}>{place.distanceKm} km away</Text>}
          <Pressable onPress={() => openDirections(place)} style={({ pressed }) => [s.directions, pressed && s.pressed]}>
            <Ionicons name="navigate-outline" size={18} color={colors.primaryDark} />
            <Text style={s.directionsText}>Directions</Text>
          </Pressable>
        </Card>
      ))}
      {places.length === 0 && <Card style={s.empty}><Text style={s.emptyTitle}>No places found</Text><Text style={s.muted}>This directory currently contains curated entries only.</Text></Card>}
      <Text style={s.note}>Location-based nearby search will be enabled when a verified device location provider is connected. Directory entries should be verified before production use.</Text>
    </Screen>
  );
}
const s = StyleSheet.create({
  eyebrow:{color:colors.primary,fontSize:11,fontWeight:"800"}, heading:{color:colors.text,fontSize:28,fontWeight:"800",marginTop:spacing.sm}, muted:{color:colors.textMuted,lineHeight:20,marginTop:spacing.xs},
  filters:{flexDirection:"row",flexWrap:"wrap",gap:spacing.xs,marginTop:spacing.lg}, filter:{paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:colors.border}, filterActive:{backgroundColor:colors.primarySoft,borderColor:colors.primary}, filterText:{color:colors.textMuted,fontSize:12}, filterTextActive:{color:colors.primary,fontWeight:"800",fontSize:12},
  card:{marginTop:spacing.md}, type:{color:colors.primary,fontSize:10,fontWeight:"800"}, title:{color:colors.text,fontSize:18,fontWeight:"800",marginTop:spacing.xs}, address:{color:colors.textMuted,marginTop:spacing.sm}, desc:{color:colors.textMuted,lineHeight:20,marginTop:spacing.sm}, distance:{color:colors.primary,fontWeight:"700",marginTop:spacing.sm},
  directions:{marginTop:spacing.md,alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:spacing.xs,paddingHorizontal:12,paddingVertical:9,borderRadius:spacing.sm,backgroundColor:colors.primarySoft}, directionsText:{color:colors.primaryDark,fontWeight:"800"}, empty:{marginTop:spacing.lg}, emptyTitle:{color:colors.text,fontWeight:"800"}, note:{color:colors.textMuted,fontSize:12,lineHeight:18,marginTop:spacing.xl}, pressed:{opacity:0.7}
});