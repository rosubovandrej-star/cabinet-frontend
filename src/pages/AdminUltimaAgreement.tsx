import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminBackButton } from '@/components/admin';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';

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

const SUPPORTED_LANGUAGES = ['ru', 'en', 'fa', 'zh', 'ua'] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export default function AdminUltimaAgreement() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const initialLanguage = useMemo<SupportedLanguage>(() => {
    const normalized = (i18n.language || 'ru').split('-', 1)[0] as SupportedLanguage;
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : 'ru';
  }, [i18n.language]);

  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ultima-agreement', language],
    queryFn: () => ultimaAgreementApi.getAdminAgreement(language),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (data) {
      setDraft(data.content ?? '');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      ultimaAgreementApi.updateAdminAgreement({
        language,
        content: draft,
      }),
    onSuccess: () => {
      setError(null);
      setMessage(
        t('admin.ultimaSettings.agreementSaved', {
          defaultValue: 'Соглашение обновлено',
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['admin-ultima-agreement', language] });
      queryClient.invalidateQueries({ queryKey: ['ultima-agreement'] });
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
              defaultValue: 'Отдельная страница соглашения только для Ultima режима.',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-300">
                {t('common.language', { defaultValue: 'Язык' })}
              </label>
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value as SupportedLanguage);
                  setMessage(null);
                  setError(null);
                }}
                className="input"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
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
                onChange={(event) => {
                  setDraft(event.target.value);
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
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {t('common.save')}
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
