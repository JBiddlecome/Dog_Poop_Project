'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Matches the Android app's color scale exactly
function poopColor(count) {
  if (count >= 7) return '#dc2626';
  if (count >= 4) return '#ea580c';
  if (count >= 2) return '#ca8a04';
  return '#16a34a';
}

function circleRadius(count) {
  return Math.min(8 + count * 3, 30); // metres, same as Android app
}

// Aggregate all locations across all walks by address string
function aggregateLocations(walks) {
  const byAddr = new Map();
  for (const walk of walks) {
    for (const loc of walk.locations) {
      const key = loc.address;
      if (byAddr.has(key)) {
        byAddr.get(key).count += loc.count;
      } else {
        byAddr.set(key, { ...loc });
      }
    }
  }
  return Array.from(byAddr.values()).sort((a, b) => b.count - a.count);
}

// Block 1 center: Thornton/Empire between Niagara and Catalina in Burbank, CA
const BLOCK_CENTER = [34.195, -118.342];

export default function GpsHeatMap({ walks }) {
  const mapDivRef     = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapDivRef.current) return;

    import('leaflet').then((mod) => {
      const L = mod.default ?? mod;

      const map = L.map(mapDivRef.current, {
        center: BLOCK_CENTER,
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const locations = aggregateLocations(walks);

      if (locations.length > 0) {
        const bounds = [];
        for (const loc of locations) {
          const color = poopColor(loc.count);
          L.circle([loc.lat, loc.lng], {
            radius:      circleRadius(loc.count),
            fillColor:   color,
            fillOpacity: 0.55,
            color:       color,
            weight:      2,
          })
            .bindPopup(
              `<strong>${loc.address}</strong><br>${loc.count} poop${loc.count !== 1 ? 's' : ''} total`
            )
            .addTo(map);
          bounds.push([loc.lat, loc.lng]);
        }
        map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 17 });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (walks.length === 0) {
    return (
      <div className="w-full rounded-xl bg-sage-light border border-sage flex flex-col items-center justify-center text-center p-12 gap-3"
           style={{ height: 400 }}>
        <p className="text-sage-dark font-semibold">No walk data yet</p>
        <p className="text-sm text-sage-dark opacity-75 max-w-xs">
          Complete a survey walk with the Android app, export the JSON, and run the merge script to populate the map.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapDivRef}
      className="w-full rounded-xl overflow-hidden border border-rule"
      style={{ height: 480 }}
    />
  );
}
