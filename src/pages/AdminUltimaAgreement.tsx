import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSettingsApi, type SettingDefinition } from '@/api/adminSettings';
import { AdminBackButton } from '@/components/admin';

const AgreementIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 3.5h7l4 4v12A1.5 1.5 0 0 1 17.5 21h-9A1.5 1.5 0 0 1 7 19.5v-14A1.5 1.5 0 0 1 8.5 4"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.5V8h4" />
    <path strokeLinecap="round" d="M10 12h7M10 15h7M10 18h5" />
  </svg>
);

function isAgreementCandidate(setting: SettingDefinition): boolean {
  const text = `${setting.key} ${setting.name ?? ''}`.toLowerCase();
  const category = setting.category.key.toLowerCase();

  const legal = /agreement|terms|offer|policy|rules|соглаш|правил|оферт|политик/.test(text);
  const ultima = /ultima|happ|miniapp/.test(text) || /miniapp|happ/.test(category);
  return legal && ultima;
}

function settingValueToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminUltimaAgreement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState('');
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  });

  const candidates = useMemo(
    () => (allSettings ?? []).filter((setting) => isAgreementCandidate(setting)),
    [allSettings],
  );

  const selectedSetting = useMemo(
    () => candidates.find((setting) => setting.key === selectedKey) ?? null,
    [candidates, selectedKey],
  );

  useEffect(() => {
    if (!selectedKey && candidates.length > 0) {
      setSelectedKey(candidates[0].key);
      setDraft(settingValueToString(candidates[0].current));
    }
  }, [candidates, selectedKey]);

  useEffect(() => {
    if (selectedSetting) {
      setDraft(settingValueToString(selectedSetting.current));
    }
  }, [selectedSetting]);

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      setError(null);
      setMessage(
        t('admin.ultimaSettings.agreementSaved', {
          defaultValue: 'Соглашение обновлено',
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => {
      setMessage(null);
      setError(
        t('admin.ultimaSettings.agreementSaveError', {
          defaultValue: 'Не удалось сохранить соглашение',
        }),
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => adminSettingsApi.resetSetting(key),
    onSuccess: () => {
      setError(null);
      setMessage(
        t('admin.ultimaSettings.agreementReset', {
          defaultValue: 'Соглашение сброшено к значению по умолчанию',
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => {
      setMessage(null);
      setError(
        t('admin.ultimaSettings.agreementResetError', {
          defaultValue: 'Не удалось выполнить сброс',
        }),
      );
    },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin/ultima-settings" />
        <div className="rounded-lg bg-violet-500/20 p-2 text-violet-300">
          <AgreementIcon />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-dark-100">
            {t('admin.ultimaSettings.agreementTitle', {
              defaultValue: 'Пользовательское соглашение',
            })}
          </h1>
          <p className="text-sm text-dark-400">
            {t('admin.ultimaSettings.agreementSubtitle', {
              defaultValue: 'Редактирование страницы соглашения для режима Ultima.',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-6 text-center text-sm text-dark-400">
            {t('admin.ultimaSettings.agreementNotFound', {
              defaultValue:
                'Не найден ключ соглашения для Ultima. Добавьте setting с ключом вида ULTIMA_*_AGREEMENT в категории MINIAPP/HAPP.',
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-300">
                {t('admin.ultimaSettings.agreementSettingKey', {
                  defaultValue: 'Ключ настройки',
                })}
              </label>
              <select
                value={selectedKey}
                onChange={(e) => {
                  setSelectedKey(e.target.value);
                  setMessage(null);
                  setError(null);
                }}
                className="input"
              >
                {candidates.map((setting) => (
                  <option key={setting.key} value={setting.key}>
                    {setting.key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-dark-300">
                {t('admin.ultimaSettings.agreementContent', {
                  defaultValue: 'Содержимое страницы',
                })}
              </label>
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setMessage(null);
                  setError(null);
                }}
                className="input min-h-[360px] w-full resize-y font-mono text-sm"
                placeholder={t('admin.ultimaSettings.agreementPlaceholder', {
                  defaultValue: 'Введите текст соглашения (HTML или plain text)',
                })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={!selectedKey || updateMutation.isPending}
                onClick={() => {
                  if (!selectedKey) return;
                  updateMutation.mutate({ key: selectedKey, value: draft });
                }}
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!selectedKey || resetMutation.isPending}
                onClick={() => {
                  if (!selectedKey) return;
                  resetMutation.mutate(selectedKey);
                }}
              >
                {t('admin.settings.reset')}
              </button>
            </div>

            {message && (
              <div className="rounded-xl border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-300">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-300">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
