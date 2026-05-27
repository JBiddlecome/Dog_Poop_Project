import AsyncStorage from '@react-native-async-storage/async-storage';
import { distanceFeet } from './haversine';

const WALK_KEY = 'current_walk';
const ADDRESS_MEMORY_KEY = 'address_memory';
const PROXIMITY_FT = 60; // taps within 60 ft of an existing entry count as the same address

export async function saveWalk(walk) {
  await AsyncStorage.setItem(WALK_KEY, JSON.stringify(walk));
}

export async function loadWalk() {
  const raw = await AsyncStorage.getItem(WALK_KEY);
  if (!raw) return null;
  const walk = JSON.parse(raw);
  if (!Array.isArray(walk.locations)) return null;
  return walk;
}

export async function clearWalk() {
  await AsyncStorage.removeItem(WALK_KEY);
}

/**
 * Address Memory: persistent storage for house-specific traits
 * Format: { "Street Name": { grassType, amenity, buildingType, poopSign, signText } }
 */
export async function getAddressMemory() {
  const raw = await AsyncStorage.getItem(ADDRESS_MEMORY_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function updateAddressMemory(address, meta) {
  if (!address || address === 'Locating…' || address === 'Unknown address') return;
  const memory = await getAddressMemory();
  memory[address] = { ...(memory[address] || {}), ...meta };
  await AsyncStorage.setItem(ADDRESS_MEMORY_KEY, JSON.stringify(memory));
}

export function buildEmptyWalk(dateStr) {
  return { date: dateStr, locations: [] };
}

export function totalPoops(walk) {
  return (walk.locations ?? []).reduce((s, l) => s + l.count, 0);
}

export function addressesWithPoops(walk) {
  return (walk.locations ?? []).length;
}

export function addOrIncrementLocation(walk, lat, lng, address, meta = {}) {
  const locations = walk.locations.map((l) => ({ ...l }));

  for (let i = 0; i < locations.length; i++) {
    const d = distanceFeet({ lat, lng }, { lat: locations[i].lat, lng: locations[i].lng });
    if (d <= PROXIMITY_FT) {
      locations[i].count += 1;
      Object.assign(locations[i], meta);
      return { ...walk, locations };
    }
  }

  locations.push({ address, lat, lng, count: 1, ...meta });
  return { ...walk, locations };
}
