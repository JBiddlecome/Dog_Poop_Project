import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { saveWalk, addOrIncrementLocation, totalPoops } from '../utils/storage';
import { distanceFeet } from '../utils/haversine';

const PROXIMITY_FT    = 60;
const GPS_INTERVAL_MS = 3000;

const GRASS_OPTIONS    = ['Full grass', 'Sparse', 'Dirt', 'Rocks', 'Mulch'];
const AMENITY_OPTIONS  = ['None', 'Trash bin', 'Bag station'];
const BUILDING_OPTIONS = ['House', 'Apartment', 'Empty'];
const SIGN_OPTIONS     = ['Has sign'];

function MetaChips({ label, options, value, onChange, allowDeselect = true }) {
  return (
    <View style={s.metaGroup}>
      <Text style={s.metaGroupLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.chipRow}>
          {options.map(opt => {
            const selected = value === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[s.chip, selected && s.chipSelected]}
                onPress={() => onChange(allowDeselect && selected ? null : opt)}
              >
                <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function Survey({ walk: initialWalk, onEnd, onViewMap }) {
  const [walk,          setWalk]         = useState(initialWalk);
  const [currentPos,    setCurrentPos]   = useState(null);
  const [currentAddress, setCurrentAddress] = useState('Locating…');
  const [gpsStatus,     setGpsStatus]    = useState('searching');
  const [recording,     setRecording]    = useState(false);

  const [grassType,    setGrassType]    = useState(null);
  const [amenity,      setAmenity]      = useState('None');
  const [buildingType, setBuildingType] = useState(null);
  const [hasSign,      setHasSign]      = useState(false);
  const [signNote,     setSignNote]     = useState('');

  const walkRef     = useRef(walk);
  const posRef      = useRef(null);
  const addrRef     = useRef('');
  const visitedRef  = useRef([]); // { address, lat, lng } — tracks all positions walked past
  const signNoteRef = useRef(''); // stable ref for signNote so blur handler isn't stale

  const metaRef = useRef({ grassType: null, amenity: 'None', buildingType: null, hasSign: false, signNote: '' });
  useEffect(() => {
    metaRef.current = { grassType, amenity, buildingType, hasSign, signNote };
  }, [grassType, amenity, buildingType, hasSign, signNote]);

  useEffect(() => { walkRef.current = walk; }, [walk]);
  useEffect(() => { saveWalk(walk); }, [walk]);

  // Reset all chips when moving to a new address
  function resetMeta() {
    setGrassType(null);
    setAmenity('None');
    setBuildingType(null);
    setHasSign(false);
    setSignNote('');
    signNoteRef.current = '';
  }

  // Save metadata for the current address immediately — creates a count:0 entry if
  // no + has been pressed yet, or updates metadata on an existing entry.
  function upsertMeta(updates) {
    if (!posRef.current) return;
    const { lat, lng } = posRef.current;
    const addr = addrRef.current;
    const fullMeta = { ...metaRef.current, ...updates };
    setWalk(prev => {
      const locs = prev.locations.map(l => ({ ...l }));
      const idx = locs.findIndex(
        l => distanceFeet({ lat: l.lat, lng: l.lng }, { lat, lng }) <= PROXIMITY_FT
      );
      if (idx >= 0) {
        Object.assign(locs[idx], fullMeta);
      } else {
        locs.push({ address: addr, lat, lng, count: 0, ...fullMeta });
      }
      return { ...prev, locations: locs };
    });
  }

  function handleGrassType(val)    { setGrassType(val);    upsertMeta({ grassType: val }); }
  function handleAmenity(val)      { setAmenity(val);      upsertMeta({ amenity: val }); }
  function handleBuildingType(val) { setBuildingType(val); upsertMeta({ buildingType: val }); }

  function handleHasSign(val) {
    const selected = val !== null;
    setHasSign(selected);
    if (!selected) {
      setSignNote('');
      signNoteRef.current = '';
      upsertMeta({ hasSign: false, signNote: '' });
    } else {
      upsertMeta({ hasSign: true, signNote: signNoteRef.current });
    }
  }

  function handleSignNote(text) {
    setSignNote(text);
    signNoteRef.current = text;
  }

  // Save note text on blur so we don't upsert on every keystroke
  function handleSignNoteBlur() {
    upsertMeta({ signNote: signNoteRef.current });
  }

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

          let newAddr;
          try {
            const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (results.length > 0) {
              const r = results[0];
              newAddr = [r.streetNumber, r.street].filter(Boolean).join(' ')
                || r.name
                || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            } else {
              newAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            }
          } catch {
            newAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          }

          setCurrentAddress(newAddr);

          // Clear chips whenever the address string changes
          if (newAddr !== addrRef.current) {
            addrRef.current = newAddr;
            resetMeta();
          }

          // Track every distinct position for applyZeroVisits at walk end
          const isNew = !visitedRef.current.some(
            v => distanceFeet({ lat: v.lat, lng: v.lng }, { lat, lng }) <= PROXIMITY_FT
          );
          if (isNew) {
            visitedRef.current.push({ address: newAddr, lat, lng });
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
      const meta = { ...metaRef.current };
      // Use functional update so we always operate on the latest walk state
      setWalk(prev => addOrIncrementLocation(prev, lat, lng, addrRef.current, meta));
    } finally {
      setRecording(false);
    }
  }

  // Any position in visitedRef that isn't already in the walk gets a count:0 entry
  function applyZeroVisits(currentWalk) {
    const locations = currentWalk.locations.map(l => ({ ...l }));
    for (const v of visitedRef.current) {
      const alreadyIn = locations.some(
        l => distanceFeet({ lat: l.lat, lng: l.lng }, { lat: v.lat, lng: v.lng }) <= PROXIMITY_FT
      );
      if (!alreadyIn) {
        locations.push({ address: v.address, lat: v.lat, lng: v.lng, count: 0 });
      }
    }
    return { ...currentWalk, locations };
  }

  function handleEndWalk() {
    Alert.alert(
      'End walk?',
      `${totalPoops(walk)} poops at ${walk.locations.length} location${walk.locations.length !== 1 ? 's' : ''}.`,
      [
        { text: 'Keep Walking', style: 'cancel' },
        { text: 'End & Review', onPress: () => onEnd(applyZeroVisits(walkRef.current)) },
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

      {/* Location metadata — auto-saves on tap, clears on address change */}
      <View style={s.metaCard}>
        <MetaChips label="GRASS"    options={GRASS_OPTIONS}    value={grassType}              onChange={handleGrassType} />
        <MetaChips label="AMENITY"  options={AMENITY_OPTIONS}  value={amenity}                onChange={handleAmenity} allowDeselect={false} />
        <MetaChips label="BUILDING" options={BUILDING_OPTIONS} value={buildingType}           onChange={handleBuildingType} />
        <MetaChips label="SIGN"     options={SIGN_OPTIONS}     value={hasSign ? 'Has sign' : null} onChange={handleHasSign} />
        {hasSign && (
          <TextInput
            style={s.signNote}
            placeholder="What does the sign say?"
            placeholderTextColor="#bbb"
            value={signNote}
            onChangeText={handleSignNote}
            onBlur={handleSignNoteBlur}
            multiline
            returnKeyType="done"
          />
        )}
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
    backgroundColor: '#f8f8f8', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 14,
  },
  addrLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addrText: { fontSize: 20, fontWeight: '700', color: '#111', marginTop: 2 },

  metaCard: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#f8f8f8', borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 14, gap: 8,
  },
  metaGroup: { gap: 4 },
  metaGroupLabel: {
    fontSize: 10, fontWeight: '700', color: '#aaa',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, backgroundColor: '#e8e8e8',
  },
  chipSelected: { backgroundColor: '#16a34a' },
  chipText: { fontSize: 12, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },

  signNote: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: '#333', backgroundColor: '#fff',
    minHeight: 56, textAlignVertical: 'top',
  },

  recordBtn: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: '#16a34a',
    alignSelf: 'center', marginTop: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  recordBtnDisabled: { backgroundColor: '#a3a3a3', shadowOpacity: 0 },
  recordBtnText: { fontSize: 60, color: '#fff', lineHeight: 68, fontWeight: '300' },
  recordHint: { textAlign: 'center', color: '#888', fontSize: 12, marginTop: 6 },

  liveSection: {
    flex: 1, marginHorizontal: 16, marginTop: 14,
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
