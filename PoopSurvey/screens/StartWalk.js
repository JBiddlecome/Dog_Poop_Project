import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadWalk, buildEmptyWalk, clearWalk, totalPoops, addressesWithPoops } from '../utils/storage';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StartWalk({ onStart }) {
  const [savedWalk, setSavedWalk] = useState(null);

  useEffect(() => {
    loadWalk().then(setSavedWalk);
  }, []);

  function handleNew() {
    if (savedWalk) {
      Alert.alert(
        'Start new walk?',
        `You have an unsaved walk from ${savedWalk.date} with ${totalPoops(savedWalk)} poops recorded. Starting a new walk will discard it.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard & Start New',
            style: 'destructive',
            onPress: async () => {
              await clearWalk();
              setSavedWalk(null);
              onStart(buildEmptyWalk(todayStr()));
            },
          },
        ]
      );
    } else {
      onStart(buildEmptyWalk(todayStr()));
    }
  }

  function handleResume() {
    onStart(savedWalk);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>🐾 Poop Survey</Text>
        <Text style={s.subtitle}>Block 1 · Burbank, CA</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Today's Walk</Text>
          <Text style={s.date}>{todayStr()}</Text>
          <TouchableOpacity style={s.btnPrimary} onPress={handleNew}>
            <Text style={s.btnPrimaryText}>Start Walk</Text>
          </TouchableOpacity>
        </View>

        {savedWalk && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Resume Saved Walk</Text>
            <Text style={s.resumeInfo}>
              {savedWalk.date} · {totalPoops(savedWalk)} poops · {addressesWithPoops(savedWalk)} addresses
            </Text>
            <TouchableOpacity style={s.btnSecondary} onPress={handleResume}>
              <Text style={s.btnSecondaryText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.tip}>
          <Text style={s.tipText}>
            GPS will snap to the nearest address as you walk. Tap + for each poop you see, or type a number.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '700', color: '#111', marginTop: 12 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 8 },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  date: { fontSize: 22, fontWeight: '600', color: '#111' },
  resumeInfo: { fontSize: 16, color: '#444' },
  btnPrimary: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSecondaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tip: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipText: { fontSize: 14, color: '#166534', lineHeight: 20 },
});
