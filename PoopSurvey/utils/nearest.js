import { distanceFeet } from './haversine';
import ADDRESSES from '../data/addresses';

// Returns { address, distanceFt } for the closest address to the given coords.
export function findNearest(lat, lng) {
  const pos = { lat, lng };
  let best = null;
  let bestDist = Infinity;

  for (const addr of ADDRESSES) {
    const d = distanceFeet(pos, { lat: addr.lat, lng: addr.lng });
    if (d < bestDist) {
      bestDist = d;
      best = addr;
    }
  }

  return { address: best, distanceFt: Math.round(bestDist) };
}

export { ADDRESSES };
