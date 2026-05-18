import AsyncStorage from '@react-native-async-storage/async-storage';
import { distanceFeet } from './haversine';

const WALK_KEY = 'current_walk';
const PROXIMITY_FT = 60; // taps within 60 ft of an existing entry count as the same address

export async function saveWalk(walk) {
  await AsyncStorage.setItem(WALK_KEY, JSON.stringify(walk));
}

export async function loadWalk() {
  const raw = await AsyncStorage.getItem(WALK_KEY);
  if (!raw) return null;
  const walk = JSON.parse(raw);
  // Discard walks saved by the old schema (had counts:{} instead of locations:[])
  if (!Array.isArray(walk.locations)) return null;
  return walk;
}

export async function clearWalk() {
  await AsyncStorage.removeItem(WALK_KEY);
}

// walk shape:
// {
//   date: "2026-05-11",
//   locations: [
//     {
//       address: "2300 N Niagara St", lat: 34.1953, lng: -118.3087, count: 3,
//       grassType: "Full grass",   // "Full grass"|"Sparse"|"Dirt"|"Rocks"|"Mulch"|null
//       amenity: "None",           // "None"|"Trash bin"|"Bag station"
//       buildingType: "House",     // "House"|"Apartment"|"Empty"|null
//       hasSign: false,            // boolean — poop sign present at address
//       signNote: "",              // what the sign says
//     }
//   ]
// }

export function buildEmptyWalk(dateStr) {
  return { date: dateStr, locations: [] };
}

export function totalPoops(walk) {
  return (walk.locations ?? []).reduce((s, l) => s + l.count, 0);
}

export function addressesWithPoops(walk) {
  return (walk.locations ?? []).length;
}

// Records a poop tap. If an existing location is within PROXIMITY_FT feet,
// increments its count and updates metadata. Otherwise adds a new entry.
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
