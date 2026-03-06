import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { SALES_STATS } from '../../constants/salesStats';
import { useChartColors } from '../../hooks/useChartColors';

interface MultiSeriesAreaChartProps {
  data: { date: string; key: string; value: number }[];
  title: string;
  chartId: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  mode?: 'classic' | 'charts';
}

export function MultiSeriesAreaChart({
  data,
  title,
  chartId,
  valueLabel,
  valueFormatter,
  height = SALES_STATS.CHART.HEIGHT,
  mode = 'classic',
}: MultiSeriesAreaChartProps) {
  const { t, i18n } = useTranslation();
  const colors = useChartColors();

  // Pivot flat data into { label, [key1]: value, [key2]: value, ... }
  const { chartData, seriesKeys, rows, maxValue } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    const keySet = new Set<string>();

    for (const item of data) {
      keySet.add(item.key);
      const existing = dateMap.get(item.date) || {};
      existing[item.key] = (existing[item.key] || 0) + item.value;
      dateMap.set(item.date, existing);
    }

    const keys = Array.from(keySet).sort();
    const sortedDates = Array.from(dateMap.keys()).sort();
    const pivoted = sortedDates.map((date) => {
      const row: Record<string, string | number> = {
        date,
        label: new Date(date + 'T00:00:00').toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
      };
      const values = dateMap.get(date) || {};
      for (const key of keys) {
        row[key] = values[key] || 0;
      }
      return row;
    });

    const classicRows = sortedDates.map((date) => {
      const values = dateMap.get(date) || {};
      const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
      });

      return {
        date,
        label: formattedDate,
        values: keys.map((key) => ({ key, value: values[key] || 0 })),
      };
    });

    const classicMax = classicRows.reduce((acc, row) => {
      const rowMax = row.values.reduce((inner, item) => Math.max(inner, item.value), 0);
      return Math.max(acc, rowMax);
    }, 0);

    return { chartData: pivoted, seriesKeys: keys, rows: classicRows, maxValue: classicMax };
  }, [data, i18n.language]);

  if (data.length === 0) {
    return (
      <div className="bento-card">
        <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
        <div className="flex items-center justify-center text-sm text-dark-400" style={{ height }}>
          {t('common.noData')}
        </div>
      </div>
    );
  }

  if (mode === 'classic') {
    return (
      <div className="bento-card" data-chart-id={chartId}>
        <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>

        <div className="mb-3 flex flex-wrap gap-2 text-xs text-dark-300">
          {seriesKeys.map((key, index) => (
            <div
              key={key}
              className="flex items-center gap-1.5 rounded-md bg-dark-800/40 px-2 py-1"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length],
                }}
              />
              <span className="truncate">{key}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2" style={{ minHeight: height }}>
          {rows.map((row) => (
            <div key={row.date} className="space-y-1">
              <div className="text-xs text-dark-300">{row.label}</div>
              <div className="space-y-1.5">
                {row.values.map((item, index) => {
                  const color = SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length];
                  const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 2) : 0;
                  const displayValue = valueFormatter ? valueFormatter(item.value) : item.value;
                  return (
                    <div key={`${row.date}-${item.key}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-dark-400">
                        <span className="truncate">{item.key}</span>
                        <span className="shrink-0">
                          {displayValue}
                          {valueLabel ? ` ${valueLabel}` : ''}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-dark-800/60">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${width}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card">
      <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={SALES_STATS.CHART.MARGIN}>
          <defs>
            {seriesKeys.map((key, i) => {
              const color = SALES_STATS.BAR_COLORS[i % SALES_STATS.BAR_COLORS.length];
              return (
                <linearGradient
                  key={key}
                  id={`gradient-${chartId}-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset={SALES_STATS.GRADIENT.START_OFFSET}
                    stopColor={color}
                    stopOpacity={SALES_STATS.GRADIENT.START_OPACITY}
                  />
                  <stop
                    offset={SALES_STATS.GRADIENT.END_OFFSET}
                    stopColor={color}
                    stopOpacity={SALES_STATS.GRADIENT.END_OPACITY}
                  />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray={SALES_STATS.GRID_DASH} stroke={colors.grid} />
          <XAxis
            dataKey="label"
            tick={{ fill: colors.tick, fontSize: SALES_STATS.AXIS.TICK_FONT_SIZE }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: colors.tick, fontSize: SALES_STATS.AXIS.TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={false}
            width={SALES_STATS.AXIS.WIDTH}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: SALES_STATS.TOOLTIP.BORDER_RADIUS,
              fontSize: SALES_STATS.TOOLTIP.FONT_SIZE,
            }}
            labelStyle={{ color: colors.label }}
            formatter={(value: number | undefined, name: string | undefined) => [
              valueFormatter ? valueFormatter(value ?? 0) : (value ?? 0),
              name || valueLabel || '',
            ]}
          />
          <Legend />
          {seriesKeys.map((key, i) => {
            const color = SALES_STATS.BAR_COLORS[i % SALES_STATS.BAR_COLORS.length];
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={color}
                fill={`url(#gradient-${chartId}-${i})`}
                strokeWidth={SALES_STATS.STROKE_WIDTH}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
