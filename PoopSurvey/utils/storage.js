import AsyncStorage from '@react-native-async-storage/async-storage';

const WALK_KEY = 'current_walk';

export async function saveWalk(walk) {
  await AsyncStorage.setItem(WALK_KEY, JSON.stringify(walk));
}

export async function loadWalk() {
  const raw = await AsyncStorage.getItem(WALK_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearWalk() {
  await AsyncStorage.removeItem(WALK_KEY);
}

// walk shape:
// {
//   date: "2026-05-11",
//   counts: { "1": 2, "3": 0, ... }  — keyed by address id (string)
// }
export function buildEmptyWalk(dateStr) {
  return { date: dateStr, counts: {} };
}

export function getCount(walk, addressId) {
  return walk.counts[String(addressId)] ?? 0;
}

export function setCount(walk, addressId, value) {
  const next = { ...walk, counts: { ...walk.counts } };
  const v = Math.max(0, value);
  if (v === 0) {
    delete next.counts[String(addressId)];
  } else {
    next.counts[String(addressId)] = v;
  }
  return next;
}

export function totalPoops(walk) {
  return Object.values(walk.counts).reduce((s, n) => s + n, 0);
}

export function addressesWithPoops(walk) {
  return Object.keys(walk.counts).filter(k => walk.counts[k] > 0).length;
}
