import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { saveWalk, addOrIncrementLocation, totalPoops } from '../utils/storage';

const GPS_INTERVAL_MS = 3000;

export default function Survey({ walk: initialWalk, onEnd, onViewMap }) {
  const [walk, setWalk] = useState(initialWalk);
  const [currentPos, setCurrentPos] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('Locating…');
  const [gpsStatus, setGpsStatus] = useState('searching');
  const [recording, setRecording] = useState(false);
  const walkRef = useRef(walk);
  const posRef = useRef(null);
  const addrRef = useRef('Unknown address');

  useEffect(() => { walkRef.current = walk; }, [walk]);

  useEffect(() => {
    saveWalk(walk);
  }, [walk]);

  useEffect(() => {
    let subscription = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsStatus('error'); return; }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: GPS_INTERVAL_MS, distanceInterval: 3 },
        async (loc) => {
          const { latitude: lat, longitude: lng } = loc.coords;
          setGpsStatus('active');
          setCurrentPos({ lat, lng });
          posRef.current = { lat, lng };

          try {
            const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (results.length > 0) {
              const r = results[0];
              const addr = [r.streetNumber, r.street].filter(Boolean).join(' ')
                || r.name
                || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
              setCurrentAddress(addr);
              addrRef.current = addr;
            }
          } catch {
            const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setCurrentAddress(fallback);
            addrRef.current = fallback;
          }
        }
      );
    })();
    return () => subscription?.remove();
  }, []);

  async function handleRecord() {
    if (!posRef.current || recording) return;
    setRecording(true);
    try {
      const { lat, lng } = posRef.current;
      const updated = addOrIncrementLocation(walkRef.current, lat, lng, addrRef.current);
      setWalk(updated);
    } finally {
      setRecording(false);
    }
  }

  function handleEndWalk() {
    Alert.alert(
      'End walk?',
      `${totalPoops(walk)} poops at ${walk.locations.length} location${walk.locations.length !== 1 ? 's' : ''}.`,
      [
        { text: 'Keep Walking', style: 'cancel' },
        { text: 'End & Review', onPress: () => onEnd(walk) },
      ]
    );
  }

  const sorted = [...walk.locations].sort((a, b) => b.count - a.count);
  const gpsColor = gpsStatus === 'active' ? '#16a34a' : gpsStatus === 'error' ? '#dc2626' : '#f59e0b';
  const gpsLabel = gpsStatus === 'active' ? 'GPS active' : gpsStatus === 'error' ? 'GPS error' : 'Searching…';

  return (
    <View style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={[s.gpsDot, { backgroundColor: gpsColor }]} />
        <Text style={[s.gpsLabel, { color: gpsColor }]}>{gpsLabel}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.mapBtn} onPress={() => onViewMap(walk)}>
          <Text style={s.mapBtnText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.endBtn} onPress={handleEndWalk}>
          <Text style={s.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Current address */}
      <View style={s.addrBlock}>
        <Text style={s.addrLabel}>You are at</Text>
        <Text style={s.addrText} numberOfLines={2}>{currentAddress}</Text>
      </View>

      {/* Big record button */}
      <TouchableOpacity
        style={[s.recordBtn, (!currentPos || recording) && s.recordBtnDisabled]}
        onPress={handleRecord}
        activeOpacity={0.75}
        disabled={!currentPos || recording}
      >
        {recording
          ? <ActivityIndicator size="large" color="#fff" />
          : <Text style={s.recordBtnText}>+</Text>
        }
      </TouchableOpacity>
      <Text style={s.recordHint}>Tap when you see a poop</Text>

      {/* Live list */}
      <View style={s.liveSection}>
        <View style={s.liveTitleRow}>
          <Text style={s.liveTitle}>This walk</Text>
          <Text style={s.liveTotals}>
            {totalPoops(walk)} poops · {walk.locations.length} location{walk.locations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {sorted.length === 0
          ? <Text style={s.liveEmpty}>No poops recorded yet</Text>
          : (
            <ScrollView style={s.liveScroll} nestedScrollEnabled>
              {sorted.map((loc, i) => (
                <View key={i} style={s.liveRow}>
                  <Text style={s.liveAddr} numberOfLines={1}>{loc.address}</Text>
                  <View style={[s.liveBadge, loc.count >= 5 && s.liveBadgeHot]}>
                    <Text style={[s.liveBadgeText, loc.count >= 5 && s.liveBadgeTextHot]}>
                      {loc.count}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )
        }
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee', gap: 8,
  },
  gpsDot: { width: 10, height: 10, borderRadius: 5 },
  gpsLabel: { fontSize: 13, fontWeight: '600' },
  mapBtn: {
    backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  mapBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 14 },
  endBtn: {
    backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  endBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },

  addrBlock: {
    backgroundColor: '#f8f8f8', marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 16,
  },
  addrLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addrText: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 4 },

  recordBtn: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#16a34a',
    alignSelf: 'center', marginTop: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  recordBtnDisabled: { backgroundColor: '#a3a3a3', shadowOpacity: 0 },
  recordBtnText: { fontSize: 72, color: '#fff', lineHeight: 80, fontWeight: '300' },
  recordHint: { textAlign: 'center', color: '#888', fontSize: 13, marginTop: 10 },

  liveSection: {
    flex: 1, marginHorizontal: 16, marginTop: 20,
    borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10,
  },
  liveTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  liveTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  liveTotals: { fontSize: 12, color: '#888' },
  liveEmpty: { fontSize: 13, color: '#ccc', fontStyle: 'italic', paddingVertical: 8 },
  liveScroll: { flex: 1 },
  liveRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  liveAddr: { flex: 1, fontSize: 14, color: '#333' },
  liveBadge: {
    backgroundColor: '#dcfce7', borderRadius: 10,
    minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  liveBadgeHot: { backgroundColor: '#fee2e2' },
  liveBadgeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  liveBadgeTextHot: { color: '#dc2626' },
});
