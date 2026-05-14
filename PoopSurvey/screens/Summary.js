import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
// Import from the legacy path to fix the deprecation crash in Expo 55
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { totalPoops, clearWalk } from '../utils/storage';
import { SITE_URL, UPLOAD_PASSWORD } from '../utils/uploadConfig';

function buildExportJson(walk) {
  return JSON.stringify({
    walkDate: walk.date,
    locations: walk.locations,
  }, null, 2);
}

export default function Summary({ walk, onNewWalk, onViewMap }) {
  const [copied,       setCopied]       = useState(false);
  const [uploadState,  setUploadState]  = useState('idle'); // 'idle'|'loading'|'success'|'error'
  const [uploadMsg,    setUploadMsg]    = useState('');

  const sorted = [...walk.locations].sort((a, b) => b.count - a.count);

  async function handleCopy() {
    await Clipboard.setStringAsync(buildExportJson(walk));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  async function handleShare() {
    try {
      const json = buildExportJson(walk);
      // Sanitize filename: replace characters that are invalid on some filesystems
      const safeDate = walk.date.replace(/[/\\?%*:|"<>]/g, '-');
      const path = FileSystem.cacheDirectory + `walk-${safeDate}.json`;

      // Use the legacy write method
      await FileSystem.writeAsStringAsync(path, json, { encoding: 'utf8' });

      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: `Walk data ${walk.date}`,
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      alert("Could not share file. Try copying the JSON instead.");
    }
  }

  async function handleUpload() {
    setUploadState('loading');
    setUploadMsg('');
    try {
      const res = await fetch(`${SITE_URL}/api/upload-walk`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${UPLOAD_PASSWORD}`,
        },
        body: JSON.stringify({
          walkDate:  walk.date,
          locations: walk.locations,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUploadState('success');
        setUploadMsg(data.message ?? 'Uploaded!');
      } else {
        setUploadState('error');
        setUploadMsg(data.error ?? `Error ${res.status}`);
      }
    } catch (err) {
      setUploadState('error');
      setUploadMsg('Network error — check your connection.');
    }
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

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{totalPoops(walk)}</Text>
            <Text style={s.statLabel}>total poops</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{walk.locations.length}</Text>
            <Text style={s.statLabel}>locations</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>
              {walk.locations.length > 0
                ? (totalPoops(walk) / walk.locations.length).toFixed(1)
                : '—'}
            </Text>
            <Text style={s.statLabel}>avg / loc</Text>
          </View>
        </View>

        {/* View on map button */}
        <TouchableOpacity style={s.mapBtn} onPress={() => onViewMap(walk)}>
          <Text style={s.mapBtnText}>View on Map</Text>
        </TouchableOpacity>

        {/* Location list */}
        {sorted.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Locations</Text>
            {sorted.map((loc, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowAddr} numberOfLines={1}>{loc.address}</Text>
                <View style={[s.badge, loc.count >= 5 && s.badgeHot]}>
                  <Text style={[s.badgeText, loc.count >= 5 && s.badgeTextHot]}>{loc.count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upload to website */}
        <View style={s.uploadCard}>
          <Text style={s.uploadTitle}>Upload to Website</Text>
          <Text style={s.uploadBody}>
            Send this walk directly to the website. The heat map will update in ~2 minutes.
          </Text>
          <TouchableOpacity
            style={[
              s.uploadBtn,
              uploadState === 'success' && s.uploadBtnSuccess,
              uploadState === 'error'   && s.uploadBtnError,
              uploadState === 'loading' && s.uploadBtnLoading,
            ]}
            onPress={handleUpload}
            disabled={uploadState === 'loading' || uploadState === 'success'}
          >
            {uploadState === 'loading'
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.uploadBtnText}>
                  {uploadState === 'success' ? '✓ Uploaded'
                    : uploadState === 'error' ? 'Retry Upload'
                    : 'Upload to Website'}
                </Text>
            }
          </TouchableOpacity>
          {uploadMsg !== '' && (
            <Text style={[s.uploadFeedback, uploadState === 'error' && s.uploadFeedbackError]}>
              {uploadMsg}
            </Text>
          )}
        </View>

        {/* Manual export fallback */}
        <View style={s.exportCard}>
          <Text style={s.exportTitle}>Manual Export</Text>
          <Text style={s.exportBody}>
            Or copy / share the raw JSON to merge manually.
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
    flexDirection: 'row', backgroundColor: '#f8f8f8',
    borderRadius: 16, paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e0e0e0', marginVertical: 6 },

  mapBtn: {
    backgroundColor: '#eff6ff', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  mapBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 15 },

  section: { gap: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#fafafa', borderRadius: 10, marginBottom: 2,
  },
  rowAddr: { flex: 1, fontSize: 14, color: '#333' },
  badge: {
    backgroundColor: '#dcfce7', borderRadius: 10,
    minWidth: 32, height: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeHot: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  badgeTextHot: { color: '#dc2626' },

  uploadCard: {
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 18, gap: 10,
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: '#14532d' },
  uploadBody: { fontSize: 13, color: '#166534', lineHeight: 20 },
  uploadBtn: {
    backgroundColor: '#16a34a', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  uploadBtnSuccess: { backgroundColor: '#15803d' },
  uploadBtnError:   { backgroundColor: '#dc2626' },
  uploadBtnLoading: { backgroundColor: '#86efac' },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  uploadFeedback: { fontSize: 12, color: '#166534', textAlign: 'center' },
  uploadFeedbackError: { color: '#dc2626' },

  exportCard: {
    backgroundColor: '#f0f9ff', borderRadius: 16, padding: 18, gap: 10,
  },
  exportTitle: { fontSize: 15, fontWeight: '700', color: '#0c4a6e' },
  exportBody: { fontSize: 13, color: '#1e3a5f', lineHeight: 20 },
  exportBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  copyBtn: {
    flex: 1, backgroundColor: '#0369a1', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  copyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  shareBtn: {
    flex: 1, backgroundColor: '#075985', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  doneBtn: {
    backgroundColor: '#16a34a', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
