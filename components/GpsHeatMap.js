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
  return Math.min(8 + count * 3, 30); // metres
}

// Aggregate locations across walks. For numeric data, sum total and track walkCount.
// For metadata (physical attributes), always keep the latest non-null value so
// corrections from newer walks overwrite stale data.
function aggregateLocations(walks) {
  const byAddr = new Map();
  for (const walk of walks) {
    for (const loc of walk.locations) {
      const key = loc.address;
      if (byAddr.has(key)) {
        const e = byAddr.get(key);
        e.total += loc.count;
        e.walkCount += 1;
        // Take the most recent non-null/non-empty metadata value
        if (loc.grassType    != null) e.grassType    = loc.grassType;
        if (loc.amenity      != null) e.amenity      = loc.amenity;
        if (loc.buildingType != null) e.buildingType = loc.buildingType;
        if (loc.hasSign      != null) e.hasSign      = loc.hasSign;
        if (loc.signNote               ) e.signNote  = loc.signNote;
      } else {
        byAddr.set(key, { ...loc, total: loc.count, walkCount: 1 });
      }
    }
  }
  return Array.from(byAddr.values())
    .map(e => ({ ...e, avg: e.total / e.walkCount }))
    .sort((a, b) => b.avg - a.avg);
}

// Build the Leaflet popup HTML for a location, including any available metadata.
function buildPopupHtml(loc) {
  let html = `<strong style="font-size:13px">${loc.address}</strong>`;

  html += `<div style="margin-top:4px;color:#555;font-size:12px">`;
  html += `${loc.avg.toFixed(1)} avg/walk &nbsp;·&nbsp; ${loc.total} total &nbsp;·&nbsp; ${loc.walkCount} walk${loc.walkCount !== 1 ? 's' : ''}`;
  html += `</div>`;

  // Physical / environmental chips
  const chips = [];
  if (loc.grassType)                         chips.push(`🌿 ${loc.grassType}`);
  if (loc.buildingType === 'House')          chips.push('🏠 House');
  else if (loc.buildingType === 'Apartment') chips.push('🏢 Apartment');
  else if (loc.buildingType === 'Empty')     chips.push('⬜ Empty lot');
  if (loc.amenity === 'Trash bin')           chips.push('🗑️ Trash bin');
  else if (loc.amenity === 'Bag station')    chips.push('🐾 Bag station');

  if (chips.length > 0) {
    html += `<div style="margin-top:5px;font-size:11px;color:#666">${chips.join(' &nbsp;·&nbsp; ')}</div>`;
  }

  // Sign info
  if (loc.hasSign) {
    html += `<div style="margin-top:4px;font-size:11px;color:#666">🪧 Sign present`;
    if (loc.signNote) html += `: <em style="color:#444">${loc.signNote}</em>`;
    html += `</div>`;
  }

  return html;
}

// Block 1 center: Thornton/Empire between Niagara and Catalina in Burbank, CA
const BLOCK_CENTER = [34.195, -118.342];

export default function GpsHeatMap({ walks }) {
  const mapDivRef      = useRef(null);
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
          const color = poopColor(loc.avg);
          L.circle([loc.lat, loc.lng], {
            radius:      circleRadius(loc.avg),
            fillColor:   color,
            fillOpacity: 0.55,
            color:       color,
            weight:      2,
          })
            .bindPopup(buildPopupHtml(loc), { maxWidth: 260 })
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
