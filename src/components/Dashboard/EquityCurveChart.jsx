import React, { useState, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw } from '../../utils/formatters';

export const EquityCurveChart = () => {
  const { stats, currency, usdToInrRate } = useTrading();
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  const data = stats.equityCurve || [];

  if (stats.closedCount === 0) {
    return (
      <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm h-80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-xs font-bold tracking-widest uppercase">
            EQUITY CURVE
          </h3>
          <span className="text-[#64748b] text-[11px] font-mono">
            cumulative P&L · closed trades
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#00f098]/10 border border-[#00f098]/20 flex items-center justify-center text-[#00f098] mb-1">
            📈
          </div>
          <div className="text-sm font-semibold text-white">No closed trades yet</div>
          <p className="text-xs text-[#64748b] max-w-sm">
            Click &ldquo;+ Log Trade&rdquo; to record your trades. Once closed, your equity growth curve will automatically appear here.
          </p>
        </div>
      </div>
    );
  }

  // Dimensions
  const width = 640;
  const height = 260;
  const padding = { top: 20, right: 25, bottom: 35, left: 55 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Values
  const cumPnlValues = data.map((d) => d.cumPnl);
  const minVal = Math.min(0, ...cumPnlValues);
  const maxVal = Math.max(100, ...cumPnlValues) * 1.1; // head room

  const getX = (index) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    const range = maxVal - minVal || 1;
    return padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  // Generate smooth SVG path using cubic Bezier spline
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.cumPnl) }));

  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  // Area path for gradient fill
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
    : '';

  // Generate Y axis ticks (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => minVal + pct * (maxVal - minVal));

  // Generate X axis tick indices (approx 6 ticks)
  const step = Math.max(1, Math.floor(data.length / 6));
  const xIndices = [];
  for (let i = 0; i < data.length; i += step) {
    xIndices.push(i);
  }
  if (!xIndices.includes(data.length - 1)) {
    xIndices.push(data.length - 1);
  }

  // Mouse hover detection
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    
    // Find closest point
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const activeData = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-xs font-bold tracking-widest uppercase">
          EQUITY CURVE
        </h3>
        <span className="text-[#64748b] text-[11px] font-mono">
          cumulative P&L · closed trades
        </span>
      </div>

      {/* SVG Chart */}
      <div
        ref={containerRef}
        className="w-full relative cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="equityGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f098" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#00f098" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00f098" stopOpacity="0.0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid horizontal lines & Y Labels */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            const formattedVal = currency === 'INR'
              ? `₹${((val * (usdToInrRate || 93.51)) / 1000).toFixed(1)}k`
              : `$${(val / 1000).toFixed(1)}k`;

            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#15212c"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#546577"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {formattedVal}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {xIndices.map((idx) => {
            const item = data[idx];
            if (!item) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="#546577"
                fontSize="10"
                fontFamily="monospace"
              >
                {item.date}
              </text>
            );
          })}

          {/* Area fill */}
          {areaD && (
            <path d={areaD} fill="url(#equityGlow)" />
          )}

          {/* Curve Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#00f098"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lineGlow)"
            />
          )}

          {/* Hover indicator */}
          {activePoint && (
            <g>
              {/* Vertical line */}
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + chartHeight}
                stroke="#00f098"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.7"
              />
              {/* Outer pulsing ring */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill="#00f098"
                fillOpacity="0.25"
              />
              {/* Center point */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="3.5"
                fill="#00f098"
                stroke="#080d12"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && activeData && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-[#0d1620] border border-[#00f098]/40 px-3 py-2 rounded-lg shadow-xl text-left"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100 - 8}%`,
            }}
          >
            <div className="text-[10px] text-[#64748b] font-mono">
              {activeData.fullDate || activeData.date} {activeData.pair ? `· ${activeData.pair}` : ''}
            </div>
            <div className="text-white font-mono font-bold text-xs">
              Equity: {formatCurrencyRaw(activeData.cumPnl, currency, true)}
            </div>
            {activeData.pnl !== 0 && (
              <div
                className={`text-[11px] font-mono font-semibold ${
                  activeData.pnl > 0 ? 'text-[#00f098]' : 'text-[#ff4d4d]'
                }`}
              >
                Trade: {formatCurrencyRaw(activeData.pnl, currency, true)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

