import { Toggle } from './Toggle';
import type { SettingDefinition } from '@/components/ui/backgrounds/types';

export function SettingField({
  def,
  value,
  onChange,
  t,
}: {
  def: SettingDefinition;
  value: unknown;
  onChange: (val: unknown) => void;
  t: (key: string) => string;
}) {
  if (def.type === 'number') {
    const numVal = (value as number) ?? (def.default as number);
    const displayVal = numVal < 0.01 ? numVal.toExponential(1) : String(numVal);
    return (
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-dark-300">{t(def.label)}</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={numVal}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-24 accent-accent-500"
          />
          <span className="w-16 text-right text-xs tabular-nums text-dark-400">{displayVal}</span>
        </div>
      </div>
    );
  }

  if (def.type === 'color') {
    const colorVal = (value as string) ?? (def.default as string);
    // HTML color input only supports hex — for rgba defaults, show a neutral hex
    const hexForInput = /^#[0-9a-fA-F]{3,8}$/.test(colorVal) ? colorVal : '#818cf8';
    return (
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-dark-300">{t(def.label)}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hexForInput}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border border-dark-600 bg-transparent"
          />
          <span className="w-16 text-right text-xs text-dark-400">{colorVal}</span>
        </div>
      </div>
    );
  }

  if (def.type === 'boolean') {
    const boolVal = (value as boolean) ?? (def.default as boolean);
    return (
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-dark-300">{t(def.label)}</label>
        <Toggle checked={boolVal} onChange={() => onChange(!boolVal)} />
      </div>
    );
  }

  if (def.type === 'select' && def.options) {
    const selectVal = (value as string) ?? (def.default as string);
    return (
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-dark-300">{t(def.label)}</label>
        <select
          value={selectVal}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-1.5 text-sm text-dark-200 focus:border-accent-500 focus:outline-none"
        >
          {def.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label.startsWith('admin.') ? t(opt.label) : opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}
