import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { SALES_STATS } from '../../constants/salesStats';
import { useChartColors } from '../../hooks/useChartColors';

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
  height?: number;
  mode?: 'classic' | 'charts';
}

export function DonutChart({
  data,
  title,
  height = SALES_STATS.CHART.PIE_HEIGHT,
  mode = 'classic',
}: DonutChartProps) {
  const { t } = useTranslation();
  const colors = useChartColors();
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

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
      <div className="bento-card">
        <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
        <div className="space-y-2" style={{ minHeight: height }}>
          {data.map((entry, index) => {
            const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
            const color =
              entry.color || SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length];
            return (
              <div key={entry.name} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-dark-300">{entry.name}</span>
                  </div>
                  <span className="shrink-0 text-dark-400">
                    {entry.value} ({percent}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-dark-800/60">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${percent}%`, backgroundColor: color }}
                  />
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color || SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: SALES_STATS.TOOLTIP.BORDER_RADIUS,
              fontSize: SALES_STATS.TOOLTIP.FONT_SIZE,
            }}
            labelStyle={{ color: colors.label }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-dark-400">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  entry.color || SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length],
              }}
            />
            <span>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
