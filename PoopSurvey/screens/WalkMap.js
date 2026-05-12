import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Circle, Marker, Callout } from 'react-native-maps';
import { totalPoops } from '../utils/storage';

function poopColor(count) {
  if (count >= 7) return '#dc2626'; // red
  if (count >= 4) return '#ea580c'; // orange
  if (count >= 2) return '#ca8a04'; // yellow
  return '#16a34a';                 // green
}

function circleRadius(count) {
  return Math.min(8 + count * 3, 30); // metres, caps at 30
}

function getRegion(locations) {
  if (locations.length === 0) return null;

  const lats = locations.map((l) => l.lat);
  const lngs = locations.map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const padLat = Math.max((maxLat - minLat) * 0.4, 0.002);
  const padLng = Math.max((maxLng - minLng) * 0.4, 0.002);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat + padLat,
    longitudeDelta: maxLng - minLng + padLng,
  };
}

export default function WalkMap({ walk, onBack }) {
  const region = getRegion(walk.locations);

  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>{walk.date}</Text>
        <Text style={s.subtitle}>
          {totalPoops(walk)} poops · {walk.locations.length} location{walk.locations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Map */}
      {region ? (
        <MapView style={s.map} initialRegion={region} showsUserLocation>
          {walk.locations.map((loc, i) => (
            <React.Fragment key={i}>
              <Circle
                center={{ latitude: loc.lat, longitude: loc.lng }}
                radius={circleRadius(loc.count)}
                fillColor={poopColor(loc.count) + '88'}
                strokeColor={poopColor(loc.count)}
                strokeWidth={2}
              />
              <Marker
                coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[s.markerDot, { backgroundColor: poopColor(loc.count) }]}>
                  <Text style={s.markerText}>{loc.count}</Text>
                </View>
                <Callout>
                  <View style={s.callout}>
                    <Text style={s.calloutAddr}>{loc.address}</Text>
                    <Text style={s.calloutCount}>{loc.count} poop{loc.count !== 1 ? 's' : ''}</Text>
                  </View>
                </Callout>
              </Marker>
            </React.Fragment>
          ))}
        </MapView>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyText}>No locations recorded yet.</Text>
          <Text style={s.emptyHint}>Go back and tap + when you see a poop.</Text>
        </View>
      )}

      {/* Legend */}
      <View style={s.legend}>
        {[
          { label: '1', color: '#16a34a' },
          { label: '2–3', color: '#ca8a04' },
          { label: '4–6', color: '#ea580c' },
          { label: '7+', color: '#dc2626' },
        ].map(({ label, color }) => (
          <View key={label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: color }]} />
            <Text style={s.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { marginBottom: 4 },
  backBtnText: { fontSize: 15, color: '#1d4ed8', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },

  map: { flex: 1 },

  markerDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  markerText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  callout: { padding: 8, minWidth: 140 },
  calloutAddr: { fontSize: 13, fontWeight: '600', color: '#111' },
  calloutCount: { fontSize: 12, color: '#888', marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888' },
  emptyHint: { fontSize: 13, color: '#bbb', marginTop: 6, textAlign: 'center' },

  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12, color: '#555' },
});
