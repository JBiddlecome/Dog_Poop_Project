import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {
  saveWalk, addOrIncrementLocation, totalPoops,
  getAddressMemory, updateAddressMemory
} from '../utils/storage';
import { distanceFeet } from '../utils/haversine';

const PROXIMITY_FT    = 60;
const GPS_INTERVAL_MS = 3000;

const GRASS_OPTIONS    = ['Full grass', 'Sparse', 'Dirt', 'Rocks', 'Mulch'];
const AMENITY_OPTIONS  = ['None', 'Trash bin', 'Bag station'];
const BUILDING_OPTIONS = ['House', 'Apartment', 'Empty'];
const SIGN_OPTIONS     = ['No Sign', 'Sign'];

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

  // Metadata states
  const [grassType,    setGrassType]    = useState(null);
  const [amenity,      setAmenity]      = useState('None');
  const [buildingType, setBuildingType] = useState(null);
  const [poopSign,     setPoopSign]     = useState('No Sign');
  const [signText,     setSignText]     = useState('');

  const walkRef   = useRef(walk);
  const posRef    = useRef(null);
  const addrRef   = useRef('Locating…');
  const visitedRef = useRef([]);

  const metaRef = useRef({ grassType: null, amenity: 'None', buildingType: null, poopSign: 'No Sign', signText: '' });
  useEffect(() => {
    metaRef.current = { grassType, amenity, buildingType, poopSign, signText };
  }, [grassType, amenity, buildingType, poopSign, signText]);

  useEffect(() => { walkRef.current = walk; }, [walk]);
  useEffect(() => { saveWalk(walk); }, [walk]);

  async function loadMetaForAddress(address) {
    const memory = await getAddressMemory();
    const saved = memory[address] || {};
    setGrassType(saved.grassType || null);
    setAmenity(saved.amenity || 'None');
    setBuildingType(saved.buildingType || null);
    setPoopSign(saved.poopSign || 'No Sign');
    setSignText(saved.signText || '');
  }

  async function upsertMeta(updates) {
    if (!posRef.current || !addrRef.current || addrRef.current === 'Locating…') return;
    const { lat, lng } = posRef.current;
    const addr = addrRef.current;
    const fullMeta = { ...metaRef.current, ...updates };

    await updateAddressMemory(addr, fullMeta);
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
  function handlePoopSign(val)     { setPoopSign(val || 'No Sign'); upsertMeta({ poopSign: val || 'No Sign' }); }
  function handleSignTextChange(text) { setSignText(text); }
  function handleSignTextBlur()       { upsertMeta({ signText }); }

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
              newAddr = [r.streetNumber, r.street].filter(Boolean).join(' ') || r.name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            } else { newAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
          } catch { newAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }

          if (newAddr !== addrRef.current) {
            addrRef.current = newAddr;
            setCurrentAddress(newAddr);
            loadMetaForAddress(newAddr);
          }
          const isNew = !visitedRef.current.some(v => distanceFeet({ lat: v.lat, lng: v.lng }, { lat, lng }) <= PROXIMITY_FT);
          if (isNew) { visitedRef.current.push({ address: newAddr, lat, lng }); }
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
      setWalk(prev => addOrIncrementLocation(prev, lat, lng, addrRef.current, meta));
    } finally { setRecording(false); }
  }

  function applyZeroVisits(currentWalk) {
    const locations = currentWalk.locations.map(l => ({ ...l }));
    for (const v of visitedRef.current) {
      const alreadyIn = locations.some(l => distanceFeet({ lat: l.lat, lng: l.lng }, { lat: v.lat, lng: v.lng }) <= PROXIMITY_FT);
      if (!alreadyIn) { locations.push({ address: v.address, lat: v.lat, lng: v.lng, count: 0 }); }
    }
    return { ...currentWalk, locations };
  }

  function handleEndWalk() {
    Alert.alert('End walk?', `${totalPoops(walk)} poops at ${walk.locations.length} location${walk.locations.length !== 1 ? 's' : ''}.`,
      [{ text: 'Keep Walking', style: 'cancel' }, { text: 'End & Review', onPress: () => onEnd(applyZeroVisits(walkRef.current)) }]
    );
  }

  const sorted = [...walk.locations].sort((a, b) => b.count - a.count);
  const gpsColor = gpsStatus === 'active' ? '#16a34a' : gpsStatus === 'error' ? '#dc2626' : '#f59e0b';
  const gpsLabel = gpsStatus === 'active' ? 'GPS active' : gpsStatus === 'error' ? 'GPS error' : 'Searching…';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={s.safe}>
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

        <ScrollView style={s.mainScroll} bounces={false}>
          <View style={s.addrBlock}>
            <Text style={s.addrLabel}>You are at</Text>
            <Text style={s.addrText} numberOfLines={2}>{currentAddress}</Text>
          </View>

          <View style={s.metaCard}>
            <MetaChips label="GRASS"    options={GRASS_OPTIONS}    value={grassType}    onChange={handleGrassType} />
            <MetaChips label="AMENITY"  options={AMENITY_OPTIONS}  value={amenity}      onChange={handleAmenity} allowDeselect={false} />
            <MetaChips label="BUILDING" options={BUILDING_OPTIONS} value={buildingType} onChange={handleBuildingType} />
            <MetaChips label="POOP SIGN" options={SIGN_OPTIONS}     value={poopSign}     onChange={handlePoopSign} allowDeselect={false} />
            {poopSign === 'Sign' && (
              <TextInput
                style={s.signInput}
                placeholder="What does the sign say?"
                placeholderTextColor="#999"
                value={signText}
                onChangeText={handleSignTextChange}
                onBlur={handleSignTextBlur}
                multiline
                returnKeyType="done"
              />
            )}
          </View>

          <TouchableOpacity
            style={[s.recordBtn, (!currentPos || recording) && s.recordBtnDisabled]}
            onPress={handleRecord}
            activeOpacity={0.75}
            disabled={!currentPos || recording}
          >
            {recording ? <ActivityIndicator size="large" color="#fff" /> : <Text style={s.recordBtnText}>+</Text>}
          </TouchableOpacity>
          <Text style={s.recordHint}>Tap when you see a poop</Text>

          <View style={s.liveSection}>
            <View style={s.liveTitleRow}>
              <Text style={s.liveTitle}>This walk</Text>
              <Text style={s.liveTotals}>{totalPoops(walk)} poops · {walk.locations.length} locations</Text>
            </View>
            {sorted.length === 0
              ? <Text style={s.liveEmpty}>No poops recorded yet</Text>
              : sorted.map((loc, i) => (
                <View key={i} style={s.liveRow}>
                  <Text style={s.liveAddr} numberOfLines={1}>{loc.address}</Text>
                  <View style={[s.liveBadge, loc.count >= 5 && s.liveBadgeHot]}>
                    <Text style={[s.liveBadgeText, loc.count >= 5 && s.liveBadgeTextHot]}>{loc.count}</Text>
                  </View>
                </View>
              ))
            }
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 8 },
  gpsDot: { width: 10, height: 10, borderRadius: 5 },
  gpsLabel: { fontSize: 13, fontWeight: '600' },
  mapBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  mapBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 14 },
  endBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  endBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  mainScroll: { flex: 1 },
  addrBlock: { backgroundColor: '#f8f8f8', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14 },
  addrLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addrText: { fontSize: 20, fontWeight: '700', color: '#111', marginTop: 2 },
  metaCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: '#f8f8f8', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, gap: 8 },
  metaGroup: { gap: 4, marginBottom: 8 },
  metaGroupLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#e8e8e8' },
  chipSelected: { backgroundColor: '#16a34a' },
  chipText: { fontSize: 12, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  signInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, color: '#333', marginTop: 4, minHeight: 60, textAlignVertical: 'top' },
  recordBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#16a34a', alignSelf: 'center', marginTop: 20, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  recordBtnDisabled: { backgroundColor: '#a3a3a3' },
  recordBtnText: { fontSize: 50, color: '#fff', fontWeight: '300' },
  recordHint: { textAlign: 'center', color: '#888', fontSize: 11, marginTop: 4, marginBottom: 20 },
  liveSection: { marginHorizontal: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, paddingBottom: 20 },
  liveTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  liveTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  liveTotals: { fontSize: 12, color: '#888' },
  liveEmpty: { fontSize: 13, color: '#ccc', fontStyle: 'italic', paddingVertical: 8 },
  liveRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  liveAddr: { flex: 1, fontSize: 14, color: '#333' },
  liveBadge: { backgroundColor: '#dcfce7', borderRadius: 10, minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  liveBadgeHot: { backgroundColor: '#fee2e2' },
  liveBadgeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  liveBadgeTextHot: { color: '#dc2626' },
});
