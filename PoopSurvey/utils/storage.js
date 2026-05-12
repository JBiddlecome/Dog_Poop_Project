import AsyncStorage from '@react-native-async-storage/async-storage';
import { distanceFeet } from './haversine';

const WALK_KEY = 'current_walk';
const PROXIMITY_FT = 60; // taps within 60 ft of an existing entry count as the same address

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
//   locations: [
//     { address: "2300 N Niagara St", lat: 34.1953, lng: -118.3087, count: 3 }
//   ]
// }

export function buildEmptyWalk(dateStr) {
  return { date: dateStr, locations: [] };
}

export function totalPoops(walk) {
  return walk.locations.reduce((s, l) => s + l.count, 0);
}

// Records a poop tap. If an existing location is within PROXIMITY_FT feet,
// increments its count. Otherwise adds a new entry.
export function addOrIncrementLocation(walk, lat, lng, address) {
  const locations = walk.locations.map((l) => ({ ...l }));

  for (let i = 0; i < locations.length; i++) {
    const d = distanceFeet({ lat, lng }, { lat: locations[i].lat, lng: locations[i].lng });
    if (d <= PROXIMITY_FT) {
      locations[i].count += 1;
      return { ...walk, locations };
    }
  }

  locations.push({ address, lat, lng, count: 1 });
  return { ...walk, locations };
}
