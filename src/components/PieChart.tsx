import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { formatCurrency } from '@/lib/utils';

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  // Clamp to avoid full-circle edge case (360 becomes a line, not a circle)
  const clampedEnd = Math.min(endAngle, startAngle + 359.999);
  const start = polarToCartesian(cx, cy, r, clampedEnd);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const innerRadius = radius * 0.52; // donut hole

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={radius} fill="#f3f4f6" />
          <Circle cx={cx} cy={cy} r={innerRadius} fill="white" />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Tidak ada data</Text>
        </View>
      </View>
    );
  }

  const slices: { path: string; color: string; label: string; value: number }[] = [];
  let currentAngle = 0;

  data.forEach((slice) => {
    if (slice.value <= 0) return;
    const sliceAngle = (slice.value / total) * 360;
    const path = buildSlicePath(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
    slices.push({ path, color: slice.color, label: slice.label, value: slice.value });
    currentAngle += sliceAngle;
  });

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Donut chart */}
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size}>
          {slices.map((slice, i) => (
            <Path key={i} d={slice.path} fill={slice.color} stroke="white" strokeWidth={2} />
          ))}
          {/* Donut hole */}
          <Circle cx={cx} cy={cy} r={innerRadius} fill="white" />
        </Svg>
        {/* Center label */}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>Total{'\n'}Pengeluaran</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 2 }}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={{ width: '100%', marginTop: 12, gap: 6 }}>
        {data.filter(d => d.value > 0).map((slice, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: slice.color }} />
              <Text style={{ fontSize: 13, color: '#374151' }}>{slice.label}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                {formatCurrency(slice.value)}
              </Text>
              <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                {((slice.value / total) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
