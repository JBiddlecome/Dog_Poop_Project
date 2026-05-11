import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Alert, FlatList, Modal, Keyboard, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeTop } from '../utils/safeTop';
import * as Location from 'expo-location';
import { findNearest, ADDRESSES } from '../utils/nearest';
import { saveWalk, getCount, setCount, totalPoops, addressesWithPoops } from '../utils/storage';

const GPS_INTERVAL_MS = 4000;
const GPS_LOCK_SECONDS = 12;

export default function Survey({ walk: initialWalk, onEnd }) {
  const insets = useSafeAreaInsets();
  const [walk, setWalk] = useState(initialWalk);
  const [currentAddr, setCurrentAddr] = useState(ADDRESSES[0]);
  const [distanceFt, setDistanceFt] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('searching');
  const [numberInput, setNumberInput] = useState('');
  const [gpsLocked, setGpsLocked] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const lockTimerRef = useRef(null);
  const gpsLockedRef = useRef(gpsLocked);

  useEffect(() => { gpsLockedRef.current = gpsLocked; }, [gpsLocked]);

  useEffect(() => {
    saveWalk(walk);
  }, [walk]);

  useEffect(() => {
    let subscription = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsStatus('error'); return; }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: GPS_INTERVAL_MS, distanceInterval: 5 },
        (loc) => {
          setGpsStatus('active');
          if (!gpsLockedRef.current) {
            const { address, distanceFt: d } = findNearest(loc.coords.latitude, loc.coords.longitude);
            setCurrentAddr(address);
            setDistanceFt(d);
          }
        }
      );
    })();
    return () => subscription?.remove();
  }, []);

  function lockGpsFor(seconds) {
    setGpsLocked(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => setGpsLocked(false), seconds * 1000);
  }

  function manualSelectAddress(addr) {
    setCurrentAddr(addr);
    lockGpsFor(GPS_LOCK_SECONDS);
    setPickerVisible(false);
  }

  const count = getCount(walk, currentAddr.id);

  function updateCount(newVal) {
    setWalk(setCount(walk, currentAddr.id, newVal));
  }

  function handlePlus() { updateCount(count + 1); }
  function handleMinus() { if (count > 0) updateCount(count - 1); }

  function handleSetNumber() {
    const n = parseInt(numberInput, 10);
    if (!isNaN(n) && n >= 0) { updateCount(n); setNumberInput(''); Keyboard.dismiss(); }
  }

  function handleEndWalk() {
    Alert.alert(
      'End walk?',
      `${totalPoops(walk)} poops recorded at ${addressesWithPoops(walk)} addresses.`,
      [
        { text: 'Keep Walking', style: 'cancel' },
        { text: 'End & Review', onPress: () => onEnd(walk) },
      ]
    );
  }

  // Live count list — addresses with nonzero counts, sorted highest first
  const liveCounts = ADDRESSES
    .map((a) => ({ ...a, count: getCount(walk, a.id) }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);

  const gpsColor = gpsStatus === 'active' ? '#16a34a' : gpsStatus === 'error' ? '#dc2626' : '#f59e0b';
  const gpsLabel = gpsStatus === 'active'
    ? (gpsLocked ? 'MANUAL' : 'GPS active')
    : gpsStatus === 'error' ? 'GPS error' : 'Searching…';

  return (
    <View style={[s.safe, { paddingTop: safeTop(insets) }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <View style={[s.gpsDot, { backgroundColor: gpsColor }]} />
          <Text style={[s.gpsLabel, { color: gpsColor }]}>{gpsLabel}</Text>
          {distanceFt !== null && gpsStatus === 'active' && !gpsLocked && (
            <Text style={s.distText}>{distanceFt} ft</Text>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleEndWalk} style={s.endBtn}>
            <Text style={s.endBtnText}>End Walk</Text>
          </TouchableOpacity>
        </View>

        {/* Current address — tap to manually pick */}
        <TouchableOpacity style={s.addrBlock} onPress={() => setPickerVisible(true)} activeOpacity={0.7}>
          <Text style={s.addrStreet}>{currentAddr.street}</Text>
          <Text style={s.addrName} numberOfLines={1}>{currentAddr.address}</Text>
          <Text style={s.addrHint}>tap to change address</Text>
        </TouchableOpacity>

        {/* Big counter */}
        <View style={s.counterRow}>
          <TouchableOpacity style={s.minusBtn} onPress={handleMinus} activeOpacity={0.7}>
            <Text style={s.minusBtnText}>−</Text>
          </TouchableOpacity>
          <View style={s.countBox}>
            <Text style={s.countNum}>{count}</Text>
            <Text style={s.countLabel}>poops here</Text>
          </View>
          <TouchableOpacity style={s.plusBtn} onPress={handlePlus} activeOpacity={0.7}>
            <Text style={s.plusBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Number input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.numInput}
            value={numberInput}
            onChangeText={setNumberInput}
            placeholder="type a number"
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleSetNumber}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={s.setBtn} onPress={handleSetNumber}>
            <Text style={s.setBtnText}>Set</Text>
          </TouchableOpacity>
        </View>

        {/* Live count list */}
        <View style={s.liveSection}>
          <View style={s.liveTitleRow}>
            <Text style={s.liveTitle}>This walk</Text>
            <Text style={s.liveTotals}>
              {totalPoops(walk)} poops · {addressesWithPoops(walk)} addresses
            </Text>
          </View>
          {liveCounts.length === 0 ? (
            <Text style={s.liveEmpty}>No poops recorded yet</Text>
          ) : (
            <ScrollView style={s.liveScroll} nestedScrollEnabled>
              {liveCounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={s.liveRow}
                  onPress={() => manualSelectAddress(a)}
                  activeOpacity={0.7}
                >
                  <Text style={s.liveAddr} numberOfLines={1}>{a.address}</Text>
                  <View style={[s.liveBadge, a.count >= 5 && s.liveBadgeHot]}>
                    <Text style={[s.liveBadgeText, a.count >= 5 && s.liveBadgeTextHot]}>{a.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

      </KeyboardAvoidingView>

      {/* Address picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[{ flex: 1, backgroundColor: '#fff' }, { paddingTop: safeTop(insets) }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Address</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ADDRESSES}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const c = getCount(walk, item.id);
              const isActive = item.id === currentAddr.id;
              return (
                <TouchableOpacity
                  style={[s.pickerRow, isActive && s.pickerRowActive]}
                  onPress={() => manualSelectAddress(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.pickerStreet, isActive && { color: '#fff' }]}>{item.street}</Text>
                    <Text style={[s.pickerAddr, isActive && { color: '#fff' }]}>{item.address}</Text>
                  </View>
                  {c > 0 && (
                    <View style={[s.pickerBadge, isActive && s.pickerBadgeActive]}>
                      <Text style={[s.pickerBadgeText, isActive && { color: '#16a34a' }]}>{c}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 6,
  },
  gpsDot: { width: 10, height: 10, borderRadius: 5 },
  gpsLabel: { fontSize: 13, fontWeight: '600' },
  distText: { fontSize: 13, color: '#888' },
  endBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  endBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },

  addrBlock: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  addrStreet: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addrName: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 2 },
  addrHint: { fontSize: 11, color: '#bbb', marginTop: 4 },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
    paddingHorizontal: 16,
  },
  minusBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  minusBtnText: { fontSize: 40, color: '#dc2626', lineHeight: 50, fontWeight: '300' },
  plusBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center',
  },
  plusBtnText: { fontSize: 40, color: '#16a34a', lineHeight: 50, fontWeight: '300' },
  countBox: { flex: 1, alignItems: 'center' },
  countNum: { fontSize: 64, fontWeight: '700', color: '#111', lineHeight: 72 },
  countLabel: { fontSize: 13, color: '#888' },

  inputRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  numInput: {
    flex: 1, height: 46,
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 16, fontSize: 18, color: '#111', backgroundColor: '#fafafa',
  },
  setBtn: {
    backgroundColor: '#1d4ed8', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center',
  },
  setBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Live count list
  liveSection: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    minHeight: 0,
  },
  liveTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  liveTotals: { fontSize: 12, color: '#888' },
  liveEmpty: { fontSize: 13, color: '#ccc', fontStyle: 'italic', paddingVertical: 8 },
  liveScroll: { flex: 1 },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  liveAddr: { flex: 1, fontSize: 14, color: '#333' },
  liveBadge: {
    backgroundColor: '#dcfce7', borderRadius: 10,
    minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  liveBadgeHot: { backgroundColor: '#fee2e2' },
  liveBadgeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  liveBadgeTextHot: { color: '#dc2626' },

  // Modal
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalClose: { fontSize: 16, color: '#1d4ed8', fontWeight: '600' },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  pickerRowActive: { backgroundColor: '#16a34a' },
  pickerStreet: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  pickerAddr: { fontSize: 15, color: '#111', fontWeight: '500', marginTop: 2 },
  pickerBadge: {
    backgroundColor: '#dcfce7', borderRadius: 12,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  pickerBadgeActive: { backgroundColor: '#fff' },
  pickerBadgeText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
});
