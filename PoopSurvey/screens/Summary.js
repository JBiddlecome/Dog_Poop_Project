import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeTop } from '../utils/safeTop';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ADDRESSES } from '../utils/nearest';
import { getCount, totalPoops, addressesWithPoops, clearWalk } from '../utils/storage';

function buildExportJson(walk) {
  // Build counts for ALL addresses (including zeros) so merge-walk.js has a complete array.
  const counts = {};
  for (const addr of ADDRESSES) {
    counts[String(addr.id)] = getCount(walk, addr.id);
  }
  return JSON.stringify({ walkDate: walk.date, counts }, null, 2);
}

export default function Summary({ walk, onNewWalk }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const nonZero = ADDRESSES.filter((a) => getCount(walk, a.id) > 0)
    .sort((a, b) => getCount(walk, b.id) - getCount(walk, a.id));

  async function handleCopy() {
    const json = buildExportJson(walk);
    await Clipboard.setStringAsync(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  async function handleShare() {
    const json = buildExportJson(walk);
    const path = FileSystem.cacheDirectory + `walk-${walk.date}.json`;
    await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: `Walk data ${walk.date}` });
  }

  async function handleDone() {
    await clearWalk();
    onNewWalk();
  }

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Walk Complete</Text>
        <Text style={s.date}>{walk.date}</Text>

        {/* Summary stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{totalPoops(walk)}</Text>
            <Text style={s.statLabel}>total poops</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{addressesWithPoops(walk)}</Text>
            <Text style={s.statLabel}>addresses</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>
              {totalPoops(walk) > 0 ? (totalPoops(walk) / addressesWithPoops(walk)).toFixed(1) : '—'}
            </Text>
            <Text style={s.statLabel}>avg / addr</Text>
          </View>
        </View>

        {/* Hot spots */}
        {nonZero.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>This Walk's Counts</Text>
            {nonZero.map((addr) => {
              const c = getCount(walk, addr.id);
              return (
                <View key={addr.id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowStreet}>{addr.street}</Text>
                    <Text style={s.rowAddr}>{addr.address}</Text>
                  </View>
                  <View style={[s.badge, c >= 5 && s.badgeHot]}>
                    <Text style={[s.badgeText, c >= 5 && s.badgeTextHot]}>{c}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Export instructions */}
        <View style={s.exportCard}>
          <Text style={s.exportTitle}>Save to Website</Text>
          <Text style={s.exportInstructions}>
            Copy or share the JSON below, then run on your laptop:{'\n\n'}
            <Text style={s.mono}>node scripts/merge-walk.js walk-{walk.date}.json</Text>
            {'\n\n'}
            That will merge this walk into heatmap.json. Commit and push to update the live site.
          </Text>
          <View style={s.exportBtns}>
            <TouchableOpacity style={s.copyBtn} onPress={handleCopy}>
              <Text style={s.copyBtnText}>{copied ? 'Copied!' : 'Copy JSON'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnText}>Share File</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.doneBtn} onPress={handleDone}>
          <Text style={s.doneBtnText}>Done — Start New Walk</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginTop: 8 },
  date: { fontSize: 16, color: '#888', marginTop: -8 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e0e0e0', marginVertical: 6 },

  section: { gap: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    marginBottom: 2,
  },
  rowStreet: { fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: '600' },
  rowAddr: { fontSize: 15, color: '#111', fontWeight: '500', marginTop: 1 },
  badge: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHot: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  badgeTextHot: { color: '#dc2626' },

  exportCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  exportTitle: { fontSize: 15, fontWeight: '700', color: '#0c4a6e' },
  exportInstructions: { fontSize: 13, color: '#1e3a5f', lineHeight: 20 },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
  exportBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  copyBtn: {
    flex: 1,
    backgroundColor: '#0369a1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  shareBtn: {
    flex: 1,
    backgroundColor: '#075985',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  doneBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
