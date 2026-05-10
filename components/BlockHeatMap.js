'use client';
import { useState } from 'react';

// Color scale: 0 = light gray, 1-2 = yellow, 3-5 = orange, 6+ = red
function heatColor(avg) {
  if (avg === 0 || avg === null) return { fill: '#F1EFE8', text: '#888780', label: 'None' };
  if (avg < 1)  return { fill: '#FDF3E0', text: '#8A6220', label: 'Rare' };
  if (avg < 2)  return { fill: '#FAC775', text: '#7A4F10', label: 'Low' };
  if (avg < 4)  return { fill: '#EF9F27', text: '#5C3A08', label: 'Medium' };
  if (avg < 6)  return { fill: '#D85A30', text: '#ffffff', label: 'High' };
  return           { fill: '#A32D2D', text: '#ffffff', label: 'Hot spot' };
}

function avg(counts) {
  if (!counts || counts.length === 0) return 0;
  return counts.reduce((a, b) => a + b, 0) / counts.length;
}

function AddressRow({ addr, side, tooltip, setTooltip }) {
  const avgCount = avg(addr.counts);
  const { fill, text } = heatColor(avgCount);
  const isActive = tooltip?.id === addr.id;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => setTooltip(addr)}
      onMouseLeave={() => setTooltip(null)}
      onClick={() => setTooltip(isActive ? null : addr)}
    >
      <rect
        x={side === 'left' ? 4 : 0}
        y={0}
        width={144}
        height={18}
        rx={3}
        fill={isActive ? '#D4E8DA' : fill}
        stroke={isActive ? '#4A7C59' : 'none'}
        strokeWidth={1}
      />
      <text
        x={side === 'left' ? 8 : 4}
        y={12.5}
        fontSize={9}
        fill={isActive ? '#2E5438' : text === '#ffffff' ? '#ffffff' : '#1E1D1A'}
        fontFamily="DM Sans, system-ui, sans-serif"
      >
        {addr.address.replace(', Burbank, CA 91504', '')}
        {addr.units > 1 ? `  (${addr.units}u)` : ''}
      </text>
      {avgCount > 0 && (
        <text
          x={side === 'left' ? 140 : 136}
          y={12.5}
          fontSize={8}
          fill={text === '#ffffff' ? '#ffffff' : '#888780'}
          fontFamily="DM Sans, system-ui, sans-serif"
          textAnchor="end"
        >
          {avgCount.toFixed(1)}
        </text>
      )}
    </g>
  );
}

export default function BlockHeatMap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  const niagara  = data.filter(a => a.street === 'Niagara');
  const catalina = data.filter(a => a.street === 'Catalina');
  const thornton = data.filter(a => a.street === 'Thornton');

  // Heights
  const ROW_H   = 20;
  const GAP      = 2;
  const STREET_W = 148;
  const BLOCK_W  = 120;
  const LABEL_H  = 24;
  const SVG_W    = STREET_W * 2 + BLOCK_W + 16;

  const maxRows  = Math.max(niagara.length, catalina.length + thornton.length);
  const SVG_H    = LABEL_H + maxRows * (ROW_H + GAP) + LABEL_H + 40;

  // Left col (Niagara) and right col (Catalina + Thornton at top)
  const rightRows = [...thornton, ...catalina];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-3xl mx-auto"
        style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}
      >
        {/* ── Street labels ── */}
        {/* Top: Thornton */}
        <rect x={STREET_W + 4} y={0} width={BLOCK_W} height={22} rx={4} fill="#2C2C2A"/>
        <text x={STREET_W + 4 + BLOCK_W/2} y={14.5} textAnchor="middle"
              fontSize={8} fill="white" fontWeight="600">
          Thornton Ave (N)
        </text>

        {/* Left: Niagara */}
        <rect x={0} y={LABEL_H} width={STREET_W} height={maxRows*(ROW_H+GAP)} rx={4}
              fill="#EEEDFE" opacity={0.5}/>
        <text x={STREET_W/2} y={LABEL_H - 6} textAnchor="middle"
              fontSize={9} fill="#3C3489" fontWeight="600">
          ← N Niagara St (west sidewalk)
        </text>

        {/* Right: Catalina */}
        <rect x={STREET_W+BLOCK_W+8} y={LABEL_H} width={STREET_W}
              height={maxRows*(ROW_H+GAP)} rx={4} fill="#E1F5EE" opacity={0.5}/>
        <text x={STREET_W+BLOCK_W+8+STREET_W/2} y={LABEL_H - 6} textAnchor="middle"
              fontSize={9} fill="#0F6E56" fontWeight="600">
          N Catalina St (east sidewalk) →
        </text>

        {/* Center block */}
        <rect x={STREET_W+4} y={LABEL_H} width={BLOCK_W}
              height={maxRows*(ROW_H+GAP)} rx={4} fill="#AFA9EC" opacity={0.15}
              stroke="#7F77DD" strokeWidth={1}/>
        <text x={STREET_W+4+BLOCK_W/2} y={LABEL_H + maxRows*(ROW_H+GAP)/2 - 6}
              textAnchor="middle" fontSize={8} fill="#534AB7">
          Block 1
        </text>
        <text x={STREET_W+4+BLOCK_W/2} y={LABEL_H + maxRows*(ROW_H+GAP)/2 + 6}
              textAnchor="middle" fontSize={7} fill="#7A6B8A">
          interior
        </text>

        {/* Bottom: Empire */}
        <rect x={STREET_W+4} y={LABEL_H + maxRows*(ROW_H+GAP) + 4}
              width={BLOCK_W} height={22} rx={4} fill="#2C2C2A"/>
        <text x={STREET_W+4+BLOCK_W/2} y={LABEL_H + maxRows*(ROW_H+GAP) + 19}
              textAnchor="middle" fontSize={8} fill="white" fontWeight="600">
          Empire Ave (S)
        </text>

        {/* ── Niagara rows ── */}
        {niagara.map((addr, i) => (
          <g key={addr.id}
             transform={`translate(0, ${LABEL_H + i * (ROW_H + GAP)})`}>
            <AddressRow addr={addr} side="left" tooltip={tooltip} setTooltip={setTooltip}/>
          </g>
        ))}

        {/* ── Catalina + Thornton rows ── */}
        {rightRows.map((addr, i) => (
          <g key={addr.id}
             transform={`translate(${STREET_W + BLOCK_W + 8}, ${LABEL_H + i * (ROW_H + GAP)})`}>
            <AddressRow addr={addr} side="right" tooltip={tooltip} setTooltip={setTooltip}/>
          </g>
        ))}
      </svg>

      {/* Tooltip card */}
      {tooltip && (
        <div className="mt-4 mx-auto max-w-sm bg-white border border-rule rounded-xl p-4 shadow-sm text-sm">
          <p className="font-semibold text-ink">{tooltip.address}</p>
          <p className="text-muted text-xs mt-0.5">
            {tooltip.street} side · {tooltip.units || '?'} unit{tooltip.units !== 1 ? 's' : ''}
            {tooltip.note ? ` · ${tooltip.note}` : ''}
          </p>
          {tooltip.counts && tooltip.counts.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs text-muted mb-1">Survey counts:</p>
              <div className="flex gap-2 flex-wrap">
                {tooltip.counts.map((c, i) => (
                  <span key={i} className="bg-sage-light text-sage-dark text-xs px-2 py-0.5 rounded">
                    Walk {i+1}: {c}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">
                Average: <strong>{avg(tooltip.counts).toFixed(1)}</strong> per walk ·{' '}
                Total: <strong>{tooltip.counts.reduce((a,b)=>a+b,0)}</strong>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted mt-2">No data recorded yet — check back after first survey walk.</p>
          )}
        </div>
      )}
    </div>
  );
}
