import { useState } from 'react'

// Single-series vertical bar chart with a hover tooltip.
// data: [{ label, value, sub }]  — `format` renders values, `sub` is shown in the tooltip.
export default function BarChart({ data, format = String, height = 220, color = '#7c3aed' }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]

  const W = 640
  const H = height
  const pad = { t: 12, r: 8, b: 28, l: 48 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const slot = innerW / data.length
  const barW = Math.min(36, slot * 0.56)
  const y = (v) => pad.t + innerH - (v / top) * innerH

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Bar chart">
        <defs>
          <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor="#fb7185" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#efe9f7" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#7a7191">
              {format(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = pad.l + slot * i + slot / 2
          const h = Math.max(0, pad.t + innerH - y(d.value))
          const r = Math.min(4, h / 2, barW / 2)
          const x0 = cx - barW / 2
          const yTop = pad.t + innerH - h
          // Rounded top corners, square base anchored to the baseline.
          const path =
            h > 0
              ? `M${x0},${pad.t + innerH} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + barW - r} Q${x0 + barW},${yTop} ${x0 + barW},${yTop + r} V${pad.t + innerH} Z`
              : ''
          const active = hover === i
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={innerH} fill={active ? '#f6f3ff' : 'transparent'} rx="8" />
              {path && <path d={path} fill="url(#bar-fill)" opacity={hover === null || active ? 1 : 0.55} />}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={active ? '#2a2140' : '#7a7191'} fontWeight={active ? 700 : 500}>
                {d.label}
              </text>
            </g>
          )
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="#ddd3ff" strokeWidth="1" />
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg shadow-brand-900/10"
          style={{ left: `${((pad.l + slot * hover + slot / 2) / W) * 100}%` }}
        >
          <p className="font-semibold text-ink">{data[hover].label}</p>
          <p className="mt-0.5 text-ink">{format(data[hover].value)}</p>
          {data[hover].sub && <p className="text-muted">{data[hover].sub}</p>}
        </div>
      )}
    </div>
  )
}

function niceTicks(max, count = 4) {
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 100) / 100)
}
