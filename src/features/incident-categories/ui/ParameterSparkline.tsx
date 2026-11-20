import { useMemo } from 'react';

interface ParameterSparklineProps {
  title: string;
  value: string;
  unit: string;
  deltaPercent: number;
  dataPoints: number[];
  color?: string;
  height?: number;
}

export function ParameterSparkline({
  title,
  value,
  unit,
  deltaPercent,
  dataPoints,
  color = 'var(--s1, #2A9DB2)',
  height = 140,
}: ParameterSparklineProps) {
  const isPositive = deltaPercent > 0;
  const deltaClass = Math.abs(deltaPercent) < 1.5 ? 'flat' : isPositive ? 'up' : 'dn';

  const { pathData, areaData } = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) {
      return { pathData: '', areaData: '' };
    }

    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min || 1;
    const width = 160;
    const paddingX = 10;
    const paddingY = 12;
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;

    const points = dataPoints.map((val, idx) => {
      const x = paddingX + (idx / (dataPoints.length - 1)) * innerWidth;
      const y = paddingY + innerHeight - ((val - min) / range) * innerHeight;
      return { x, y };
    });

    const path = points.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
      '',
    );

    const firstPt = points[0] ?? { x: paddingX, y: height };
    const lastPt = points[points.length - 1] ?? { x: width - paddingX, y: height };
    const area = `${path} L ${lastPt.x},${height - paddingY} L ${firstPt.x},${height - paddingY} Z`;

    return { pathData: path, areaData: area };
  }, [dataPoints, height]);

  return (
    <div
      className="chart-cell"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--f-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink-2)',
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        <span
          className={`delta ${deltaClass}`}
          style={{
            fontSize: '0.74rem',
            fontFamily: 'var(--f-num)',
            fontWeight: 600,
            color: isPositive ? 'var(--warn)' : 'var(--ok)',
          }}
        >
          {isPositive ? '+' : ''}
          {deltaPercent.toFixed(1)}%
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '2px 0 6px' }}>
        <span
          style={{
            fontFamily: 'var(--f-num)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-4)', fontFamily: 'var(--f-num)' }}>
          {unit}
        </span>
      </div>

      <div style={{ width: '100%', height, position: 'relative' }}>
        <svg
          viewBox={`0 0 160 ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
          aria-label={`${title} trend chart`}
        >
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Reference gridlines */}
          <line
            x1="10"
            y1={height / 4}
            x2="150"
            y2={height / 4}
            stroke="var(--line-soft)"
            strokeDasharray="2 3"
            strokeWidth="1"
          />
          <line
            x1="10"
            y1={height / 2}
            x2="150"
            y2={height / 2}
            stroke="var(--line-soft)"
            strokeDasharray="2 3"
            strokeWidth="1"
          />
          <line
            x1="10"
            y1={(3 * height) / 4}
            x2="150"
            y2={(3 * height) / 4}
            stroke="var(--line-soft)"
            strokeDasharray="2 3"
            strokeWidth="1"
          />

          {/* Area fill */}
          {areaData && (
            <path
              d={areaData}
              fill={`url(#grad-${title.replace(/\s+/g, '-')})`}
            />
          )}

          {/* Trend line */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.64rem',
          color: 'var(--ink-4)',
          fontFamily: 'var(--f-num)',
          borderTop: '1px solid var(--line-soft)',
          paddingTop: '4px',
        }}
      >
        <span>-10 min</span>
        <span>now</span>
      </div>
    </div>
  );
}
