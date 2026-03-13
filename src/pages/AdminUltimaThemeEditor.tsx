import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminSettingsApi } from '@/api/adminSettings';
import { AdminBackButton } from '@/components/admin';
import { Toggle } from '@/components/admin/Toggle';
import { SettingField } from '@/components/admin/SettingField';
import { backgroundRegistry } from '@/components/ui/backgrounds/registry';
import { BackgroundPreview } from '@/components/backgrounds/BackgroundPreview';
import type { BackgroundType, AnimationConfig } from '@/components/ui/backgrounds/types';
import { DEFAULT_ANIMATION_CONFIG } from '@/components/ui/backgrounds/types';
import { cn } from '@/lib/utils';

const DEFAULT_THEME = {
  accent: '#14cf9a',
  accentHover: '#16d8a1',
  text: '#ffffff',
  bg: '#0c2d2a',
  bgImage: 'none',
  borderRadius: '9999px',
  layout: 'centered',
  animation: {
    ...DEFAULT_ANIMATION_CONFIG,
    enabled: false,
    type: 'none',
  } as AnimationConfig,
};

export default function AdminUltimaThemeEditor() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [themeConfig, setThemeConfig] = useState(DEFAULT_THEME);
  const [isSaving, setIsSaving] = useState(false);

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setIsSaving(false);
    },
    onError: () => setIsSaving(false),
  });

  useEffect(() => {
    if (allSettings) {
      try {
        const jsonSetting = allSettings.find((s) => s.key === 'ULTIMA_THEME_JSON');
        if (jsonSetting?.current) {
          const parsed = typeof jsonSetting.current === 'string' ? JSON.parse(jsonSetting.current) : jsonSetting.current;
          setThemeConfig({ ...DEFAULT_THEME, ...parsed });
        }
      } catch (e) {
        console.error('Failed to parse ULTIMA_THEME_JSON', e);
      }
    }
  }, [allSettings]);

  const handleSave = () => {
    setIsSaving(true);
    updateSettingMutation.mutate({
      key: 'ULTIMA_THEME_JSON',
      value: JSON.stringify(themeConfig),
    });
  };

  const updateAnimationConfig = (patch: Partial<AnimationConfig>) => {
    setThemeConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        ...patch,
      },
    }));
  };

  const updateAnimationSetting = (key: string, value: unknown) => {
    setThemeConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        settings: {
          ...prev.animation.settings,
          [key]: value,
        },
      },
    }));
  };

  const handleAnimationTypeChange = (type: BackgroundType) => {
    const def = backgroundRegistry.find((d) => d.type === type);
    const defaults: Record<string, unknown> = {};
    if (def) {
      for (const s of def.settings) {
        defaults[s.key] = s.default;
      }
    }
    updateAnimationConfig({ type, settings: defaults });
  };

  const currentAnimDef = backgroundRegistry.find((d) => d.type === themeConfig.animation.type);

  const animationCategories = (() => {
    const cats = new Map<string, typeof backgroundRegistry>();
    for (const def of backgroundRegistry) {
      const list = cats.get(def.category) ?? [];
      list.push(def);
      cats.set(def.category, list);
    }
    return cats;
  })();

  if (isLoading) {
    return <div className="p-8 text-center text-dark-400">{t('common.loading')}</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminBackButton to="/admin/ultima-settings" />
          <div>
            <h1 className="text-xl font-semibold text-dark-100">
              {t('admin.ultimaSettings.themeTitle', { defaultValue: 'Редактор дизайна' })}
            </h1>
            <p className="text-sm text-dark-400">
              {t('admin.ultimaSettings.themeDesc', {
                defaultValue: 'Настройка цветов, скруглений, фонов и макета главной страницы Ultima.',
              })}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-violet-500 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-50"
        >
          {isSaving ? t('common.saving', { defaultValue: 'Сохранение...' }) : t('common.save', { defaultValue: 'Сохранить' })}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-dark-700/50 bg-dark-800/30 p-6">
          <h2 className="text-lg font-medium text-dark-100">Цвета</h2>
          
          <div className="space-y-2">
            <label className="text-sm text-dark-300">Основной цвет (Accent)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={themeConfig.accent}
                onChange={(e) => setThemeConfig({ ...themeConfig, accent: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded bg-dark-800"
              />
              <input
                type="text"
                value={themeConfig.accent}
                onChange={(e) => setThemeConfig({ ...themeConfig, accent: e.target.value })}
                className="flex-1 rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-300">Цвет при наведении (Accent Hover)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={themeConfig.accentHover}
                onChange={(e) => setThemeConfig({ ...themeConfig, accentHover: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded bg-dark-800"
              />
              <input
                type="text"
                value={themeConfig.accentHover}
                onChange={(e) => setThemeConfig({ ...themeConfig, accentHover: e.target.value })}
                className="flex-1 rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-300">Цвет текста (Text)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={themeConfig.text}
                onChange={(e) => setThemeConfig({ ...themeConfig, text: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded bg-dark-800"
              />
              <input
                type="text"
                value={themeConfig.text}
                onChange={(e) => setThemeConfig({ ...themeConfig, text: e.target.value })}
                className="flex-1 rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-300">Фоновый цвет (Background)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={themeConfig.bg}
                onChange={(e) => setThemeConfig({ ...themeConfig, bg: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded bg-dark-800"
              />
              <input
                type="text"
                value={themeConfig.bg}
                onChange={(e) => setThemeConfig({ ...themeConfig, bg: e.target.value })}
                className="flex-1 rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-dark-700/50 bg-dark-800/30 p-6">
          <h2 className="text-lg font-medium text-dark-100">Макет и Стили</h2>
          
          <div className="space-y-2">
            <label className="text-sm text-dark-300">Скругление кнопок (Border Radius)</label>
            <select
              value={themeConfig.borderRadius}
              onChange={(e) => setThemeConfig({ ...themeConfig, borderRadius: e.target.value })}
              className="w-full rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
            >
              <option value="9999px">Полное скругление (Full / Pill)</option>
              <option value="16px">Среднее скругление (16px)</option>
              <option value="8px">Небольшое скругление (8px)</option>
              <option value="0px">Квадратные (0px)</option>
            </select>
          </div>

          <div className="space-y-2">
             <label className="text-sm text-dark-300">Фоновое изображение / Градиент (CSS value)</label>
             <input
                type="text"
                value={themeConfig.bgImage}
                onChange={(e) => setThemeConfig({ ...themeConfig, bgImage: e.target.value })}
                placeholder="url(...) или linear-gradient(...) или none"
                className="w-full rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-300">Ширина макета (Layout)</label>
            <select
              value={themeConfig.layout}
              onChange={(e) => setThemeConfig({ ...themeConfig, layout: e.target.value })}
              className="w-full rounded-xl border border-dark-600 bg-dark-700 px-3 py-2 text-white outline-none focus:border-violet-500"
            >
              <option value="centered">По центру (Centered)</option>
              <option value="full">На весь экран (Full-screen)</option>
            </select>
            <p className="text-xs text-dark-400 mt-1">
              "На весь экран" позволяет растянуть контент Ultima на мобильных и ПК без ограничения по ширине.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-dark-100">Анимация фона</h2>
            <p className="text-sm text-dark-400">Настройка интерактивного/динамичного фона для режима Ultima</p>
          </div>
          <Toggle
            checked={themeConfig.animation.enabled}
            onChange={() => updateAnimationConfig({ enabled: !themeConfig.animation.enabled })}
          />
        </div>

        {themeConfig.animation.enabled && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="mb-2 block text-sm font-medium text-dark-300">
                  {t('admin.backgrounds.selectType')}
                </label>
                
                <button
                  onClick={() => handleAnimationTypeChange('none')}
                  className={cn(
                    'mb-3 w-full rounded-xl border p-3 text-left transition-colors',
                    themeConfig.animation.type === 'none'
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-dark-700/50 bg-dark-800/30 hover:border-dark-600',
                  )}
                >
                  <span className="font-medium text-dark-200">Без анимации</span>
                </button>

                <div className="space-y-4">
                  {Array.from(animationCategories.entries()).map(([category, defs]) => (
                    <div key={category}>
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-dark-500">
                        {t(`admin.backgrounds.category${category.toUpperCase()}`)}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {defs.map((def) => (
                          <button
                            key={def.type}
                            onClick={() => handleAnimationTypeChange(def.type)}
                            className={cn(
                              'rounded-xl border p-3 text-left transition-colors',
                              themeConfig.animation.type === def.type
                                ? 'border-accent-500 bg-accent-500/10'
                                : 'border-dark-700/50 bg-dark-800/30 hover:border-dark-600',
                            )}
                          >
                            <span className="block text-sm font-medium text-dark-200">
                              {t(def.labelKey)}
                            </span>
                            <span className="block text-xs text-dark-400">{t(def.descriptionKey)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-300">Превью</label>
                  <BackgroundPreview
                    type={themeConfig.animation.type}
                    settings={themeConfig.animation.settings}
                    opacity={themeConfig.animation.opacity}
                    blur={themeConfig.animation.blur}
                    className="h-48"
                  />
                </div>

                {currentAnimDef && currentAnimDef.settings.length > 0 && (
                  <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
                    <h4 className="mb-3 text-sm font-medium text-dark-200">Параметры анимации</h4>
                    <div className="space-y-3">
                      {currentAnimDef.settings.map((def) => (
                        <SettingField
                          key={def.key}
                          def={def}
                          value={themeConfig.animation.settings[def.key]}
                          onChange={(val) => updateAnimationSetting(def.key, val)}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm text-dark-300">Непрозрачность слоя</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={themeConfig.animation.opacity}
                          onChange={(e) => updateAnimationConfig({ opacity: parseFloat(e.target.value) })}
                          className="w-24 accent-accent-500"
                        />
                        <span className="w-14 text-right text-xs tabular-nums text-dark-400">
                          {themeConfig.animation.opacity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm text-dark-300">Размытие (Blur)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={themeConfig.animation.blur}
                          onChange={(e) => updateAnimationConfig({ blur: parseInt(e.target.value) })}
                          className="w-24 accent-accent-500"
                        />
                        <span className="w-14 text-right text-xs tabular-nums text-dark-400">
                          {themeConfig.animation.blur}px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
