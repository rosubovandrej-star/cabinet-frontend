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

interface DualAreaChartProps {
  data: { date: string; series1: number; series2: number }[];
  title: string;
  chartId: string;
  series1Label: string;
  series2Label: string;
  series1Color?: string;
  series2Color?: string;
  height?: number;
  mode?: 'classic' | 'charts';
}

export function DualAreaChart({
  data,
  title,
  chartId,
  series1Label,
  series2Label,
  series1Color,
  series2Color,
  height = SALES_STATS.CHART.HEIGHT,
  mode = 'classic',
}: DualAreaChartProps) {
  const { t, i18n } = useTranslation();
  const colors = useChartColors();
  const color1 = series1Color || colors.referrals;
  const color2 = series2Color || colors.earnings;

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        label: new Date(item.date + 'T00:00:00').toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
      })),
    [data, i18n.language],
  );

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
    const maxValue = Math.max(...data.map((item) => Math.max(item.series1, item.series2)), 0);

    return (
      <div className="bento-card">
        <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-dark-300">
          <div className="flex items-center gap-1.5 rounded-md bg-dark-800/40 px-2 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color1 }} />
            <span>{series1Label}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-dark-800/40 px-2 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color2 }} />
            <span>{series2Label}</span>
          </div>
        </div>

        <div className="space-y-2" style={{ minHeight: height }}>
          {chartData.map((item, index) => {
            const width1 = maxValue > 0 ? Math.max((item.series1 / maxValue) * 100, 2) : 0;
            const width2 = maxValue > 0 ? Math.max((item.series2 / maxValue) * 100, 2) : 0;

            return (
              <div key={`${item.date}-${index}`} className="space-y-1.5">
                <div className="text-xs text-dark-300">{item.label}</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-dark-400">
                    <span>{series1Label}</span>
                    <span className="shrink-0">{item.series1}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-dark-800/60">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${width1}%`, backgroundColor: color1 }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-dark-400">
                    <span>{series2Label}</span>
                    <span className="shrink-0">{item.series2}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-dark-800/60">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${width2}%`, backgroundColor: color2 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
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
            <linearGradient id={`gradient-s1-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset={SALES_STATS.GRADIENT.START_OFFSET}
                stopColor={color1}
                stopOpacity={SALES_STATS.GRADIENT.START_OPACITY}
              />
              <stop
                offset={SALES_STATS.GRADIENT.END_OFFSET}
                stopColor={color1}
                stopOpacity={SALES_STATS.GRADIENT.END_OPACITY}
              />
            </linearGradient>
            <linearGradient id={`gradient-s2-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset={SALES_STATS.GRADIENT.START_OFFSET}
                stopColor={color2}
                stopOpacity={SALES_STATS.GRADIENT.START_OPACITY}
              />
              <stop
                offset={SALES_STATS.GRADIENT.END_OFFSET}
                stopColor={color2}
                stopOpacity={SALES_STATS.GRADIENT.END_OPACITY}
              />
            </linearGradient>
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
            formatter={(value: number | undefined, name: string | undefined) => {
              const displayValue = value ?? 0;
              if (name === 'series1') return [displayValue, series1Label];
              return [displayValue, series2Label];
            }}
          />
          <Legend
            formatter={(value: string) => {
              if (value === 'series1') return series1Label;
              return series2Label;
            }}
          />
          <Area
            type="monotone"
            dataKey="series1"
            name="series1"
            stroke={color1}
            fill={`url(#gradient-s1-${chartId})`}
            strokeWidth={SALES_STATS.STROKE_WIDTH}
          />
          <Area
            type="monotone"
            dataKey="series2"
            name="series2"
            stroke={color2}
            fill={`url(#gradient-s2-${chartId})`}
            strokeWidth={SALES_STATS.STROKE_WIDTH}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
