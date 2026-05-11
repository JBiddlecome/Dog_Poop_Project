import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Alert, FlatList, Modal, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { findNearest, ADDRESSES } from '../utils/nearest';
import { saveWalk, getCount, setCount, totalPoops, addressesWithPoops } from '../utils/storage';

const GPS_INTERVAL_MS = 4000;
const GPS_LOCK_SECONDS = 12; // pause auto-select after manual address pick

export default function Survey({ walk: initialWalk, onEnd }) {
  const [walk, setWalk] = useState(initialWalk);
  const [currentAddr, setCurrentAddr] = useState(ADDRESSES[0]);
  const [distanceFt, setDistanceFt] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('searching'); // 'searching' | 'active' | 'error'
  const [numberInput, setNumberInput] = useState('');
  const [gpsLocked, setGpsLocked] = useState(false); // true = user manually picked, pause GPS
  const [pickerVisible, setPickerVisible] = useState(false);
  const lockTimerRef = useRef(null);
  const walkRef = useRef(walk);

  useEffect(() => { walkRef.current = walk; }, [walk]);

  // Persist on every change
  useEffect(() => {
    saveWalk(walk);
  }, [walk]);

  // GPS polling
  useEffect(() => {
    let subscription = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('error');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: GPS_INTERVAL_MS,
          distanceInterval: 5, // meters
        },
        (loc) => {
          setGpsStatus('active');
          if (!gpsLockedRef.current) {
            const { address, distanceFt: d } = findNearest(
              loc.coords.latitude,
              loc.coords.longitude
            );
            setCurrentAddr(address);
            setDistanceFt(d);
          }
        }
      );
    })();

    return () => subscription?.remove();
  }, []);

  // Keep a ref so the GPS callback can read gpsLocked without stale closure
  const gpsLockedRef = useRef(gpsLocked);
  useEffect(() => { gpsLockedRef.current = gpsLocked; }, [gpsLocked]);

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
    const updated = setCount(walk, currentAddr.id, newVal);
    setWalk(updated);
  }

  function handlePlus() {
    updateCount(count + 1);
  }

  function handleMinus() {
    if (count > 0) updateCount(count - 1);
  }

  function handleSetNumber() {
    const n = parseInt(numberInput, 10);
    if (!isNaN(n) && n >= 0) {
      updateCount(n);
      setNumberInput('');
      Keyboard.dismiss();
    }
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

  const gpsColor = gpsStatus === 'active' ? '#16a34a' : gpsStatus === 'error' ? '#dc2626' : '#f59e0b';
  const gpsLabel = gpsStatus === 'active' ? (gpsLocked ? `GPS paused ${GPS_LOCK_SECONDS}s` : 'GPS active') : gpsStatus === 'error' ? 'GPS error' : 'Searching…';

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <View style={[s.gpsDot, { backgroundColor: gpsColor }]} />
          <Text style={[s.gpsLabel, { color: gpsColor }]}>{gpsLabel}</Text>
          {distanceFt !== null && gpsStatus === 'active' && (
            <Text style={s.distText}>{distanceFt} ft away</Text>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleEndWalk} style={s.endBtn}>
            <Text style={s.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Address display — tap to manually pick */}
        <TouchableOpacity style={s.addrBlock} onPress={() => setPickerVisible(true)} activeOpacity={0.7}>
          <Text style={s.addrStreet}>{currentAddr.street}</Text>
          <Text style={s.addrName} numberOfLines={1}>{currentAddr.address}</Text>
          <Text style={s.addrHint}>tap to change address</Text>
          {gpsLocked && <Text style={s.lockedBadge}>MANUAL</Text>}
        </TouchableOpacity>

        {/* Big counter */}
        <View style={s.counterRow}>
          <TouchableOpacity style={s.minusBtn} onPress={handleMinus} activeOpacity={0.7}>
            <Text style={s.minusBtnText}>−</Text>
          </TouchableOpacity>

          <View style={s.countBox}>
            <Text style={s.countNum}>{count}</Text>
            <Text style={s.countLabel}>poops</Text>
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

        {/* Footer stats */}
        <View style={s.footer}>
          <View style={s.stat}>
            <Text style={s.statNum}>{totalPoops(walk)}</Text>
            <Text style={s.statLabel}>total poops</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{addressesWithPoops(walk)}</Text>
            <Text style={s.statLabel}>addresses hit</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{walk.date}</Text>
            <Text style={s.statLabel}>walk date</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Address picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
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
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  addrStreet: { fontSize: 13, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addrName: { fontSize: 26, fontWeight: '700', color: '#111', marginTop: 4 },
  addrHint: { fontSize: 12, color: '#bbb', marginTop: 6 },
  lockedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#fef9c3',
    color: '#854d0e',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 16,
    paddingHorizontal: 16,
  },
  minusBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusBtnText: { fontSize: 44, color: '#dc2626', lineHeight: 54, fontWeight: '300' },
  plusBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnText: { fontSize: 44, color: '#16a34a', lineHeight: 54, fontWeight: '300' },
  countBox: { flex: 1, alignItems: 'center' },
  countNum: { fontSize: 72, fontWeight: '700', color: '#111', lineHeight: 80 },
  countLabel: { fontSize: 14, color: '#888', marginTop: -4 },

  inputRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  numInput: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  setBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  setBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalClose: { fontSize: 16, color: '#1d4ed8', fontWeight: '600' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerRowActive: { backgroundColor: '#16a34a' },
  pickerStreet: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  pickerAddr: { fontSize: 15, color: '#111', fontWeight: '500', marginTop: 2 },
  pickerBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBadgeActive: { backgroundColor: '#fff' },
  pickerBadgeText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
});
