import React, { useState } from 'react';
import { PollActivity, PollResults as PollResultsType } from '@interactive-presentations/shared';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';

// Color palette for pie chart and bar chart
const chartColors = [
  '#0077c8', // ST Math Blue
  '#f7941d', // ST Math Orange
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

type DisplayMode = 'bars' | 'bar-chart' | 'pie';

interface PollResultsProps {
  activity: PollActivity;
  results: PollResultsType | null;
}

export const PollResults: React.FC<PollResultsProps> = ({ activity, results }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bars');

  const totalVotes = results?.totalResponses || 0;
  const responses = results?.responses || [];

  // Calculate percentages
  const optionStats = activity.options.map((option, index) => {
    const count = (responses as number[])[index] || 0;
    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
    return { option, count, percentage, color: chartColors[index % chartColors.length] };
  });

  // Find max for highlighting
  const maxCount = Math.max(...optionStats.map(s => s.count), 0);

  const renderToggleButtons = () => (
    <div style={styles.toggleContainer}>
      <button
        onClick={() => setDisplayMode('bars')}
        style={{
          ...styles.toggleButton,
          ...(displayMode === 'bars' ? styles.toggleButtonActive : {}),
        }}
        title="Horizontal Bars"
      >
        ☰
      </button>
      <button
        onClick={() => setDisplayMode('bar-chart')}
        style={{
          ...styles.toggleButton,
          ...(displayMode === 'bar-chart' ? styles.toggleButtonActive : {}),
        }}
        title="Bar Chart"
      >
        📊
      </button>
      <button
        onClick={() => setDisplayMode('pie')}
        style={{
          ...styles.toggleButton,
          ...(displayMode === 'pie' ? styles.toggleButtonActive : {}),
        }}
        title="Pie Chart"
      >
        🥧
      </button>
    </div>
  );

  const renderHorizontalBars = () => (
    <div className="space-y-4">
      {optionStats.map((stat, index) => {
        const isLeading = stat.count === maxCount && maxCount > 0;
        return (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium" style={{ color: isLeading ? stMathBlue : '#374151' }}>
                {stat.option}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{stat.count} votes</span>
                <span className="text-lg font-bold" style={{ color: isLeading ? stMathBlue : '#1f2937' }}>
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stat.percentage}%`,
                  background: isLeading
                    ? `linear-gradient(to right, ${stMathBlue}, ${stMathBlueDark})`
                    : 'linear-gradient(to right, #9ca3af, #6b7280)',
                }}
              >
                {stat.count > 0 && (
                  <div className="flex items-center justify-end h-full px-3 text-white font-semibold text-sm">
                    {stat.count}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderBarChart = () => {
    const maxPercentage = Math.max(...optionStats.map(s => s.percentage), 1);

    return (
      <div style={styles.barChartContainer}>
        <div style={styles.barChartBars}>
          {optionStats.map((stat, index) => {
            const heightPercent = maxPercentage > 0 ? (stat.percentage / maxPercentage) * 100 : 0;
            return (
              <div key={index} style={styles.barChartColumn}>
                <div style={styles.barChartValue}>
                  {stat.percentage.toFixed(0)}%
                </div>
                <div style={styles.barChartBarWrapper}>
                  <div
                    style={{
                      ...styles.barChartBar,
                      height: `${heightPercent}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
                <div style={styles.barChartLabel} title={stat.option}>
                  {stat.option.length > 12 ? stat.option.substring(0, 10) + '...' : stat.option}
                </div>
                <div style={styles.barChartCount}>
                  {stat.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    // Build conic-gradient for pie chart
    let currentAngle = 0;
    const gradientStops: string[] = [];

    optionStats.forEach((stat) => {
      const angle = (stat.percentage / 100) * 360;
      gradientStops.push(`${stat.color} ${currentAngle}deg ${currentAngle + angle}deg`);
      currentAngle += angle;
    });

    const pieGradient = gradientStops.length > 0
      ? `conic-gradient(${gradientStops.join(', ')})`
      : '#e5e7eb';

    return (
      <div style={styles.pieContainer}>
        <div style={styles.pieChartWrapper}>
          <div
            style={{
              ...styles.pieChart,
              background: totalVotes > 0 ? pieGradient : '#e5e7eb',
            }}
          />
        </div>
        <div style={styles.pieLegend}>
          {optionStats.map((stat, index) => (
            <div key={index} style={styles.legendItem}>
              <div
                style={{
                  ...styles.legendColor,
                  backgroundColor: stat.color,
                }}
              />
              <div style={styles.legendText}>
                <span style={styles.legendLabel}>{stat.option}</span>
                <span style={styles.legendValue}>
                  {stat.percentage.toFixed(1)}% ({stat.count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-gray-800">Poll Results</h3>
          {renderToggleButtons()}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: stMathBlue }}>{totalVotes}</div>
          <div className="text-sm text-gray-500">Total Votes</div>
        </div>
      </div>

      {totalVotes === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <p className="text-gray-600">Waiting for responses...</p>
        </div>
      ) : (
        <>
          {displayMode === 'bars' && renderHorizontalBars()}
          {displayMode === 'bar-chart' && renderBarChart()}
          {displayMode === 'pie' && renderPieChart()}
        </>
      )}

      {/* Real-time indicator */}
      {totalVotes > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates enabled</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toggleContainer: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px',
  },
  toggleButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  // Bar Chart styles
  barChartContainer: {
    padding: '20px 0',
  },
  barChartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '16px',
    height: '250px',
    paddingBottom: '60px',
  },
  barChartColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    maxWidth: '80px',
  },
  barChartValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  barChartBarWrapper: {
    width: '100%',
    height: '180px',
    display: 'flex',
    alignItems: 'flex-end',
  },
  barChartBar: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.5s ease-out',
    minHeight: '4px',
  },
  barChartLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
    textAlign: 'center',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  barChartCount: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  // Pie Chart styles
  pieContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    padding: '20px 0',
    flexWrap: 'wrap',
  },
  pieChartWrapper: {
    position: 'relative',
  },
  pieChart: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    transition: 'all 0.5s ease-out',
  },
  pieLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  legendText: {
    display: 'flex',
    flexDirection: 'column',
  },
  legendLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  legendValue: {
    fontSize: '12px',
    color: '#6b7280',
  },
};
