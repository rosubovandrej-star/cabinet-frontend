import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'u',
      'strong',
      'em',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      's',
      'del',
      'ins',
      'span',
      'div',
      'tg-spoiler',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'start'],
    ALLOW_DATA_ATTR: false,
  });

const formatContent = (content: string): string => {
  const value = (content || '').trim();
  if (!value) return '';

  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(value);
  if (hasBlockHtml) return sanitizeHtml(value);

  return sanitizeHtml(
    value
      .split(/\n\n+/)
      .map((paragraph) => `<p>${paragraph.trim().split('\n').join('<br/>')}</p>`)
      .join(''),
  );
};

export function UltimaAgreement() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['ultima-agreement', i18n.language],
    queryFn: () => ultimaAgreementApi.getAgreement(i18n.language || 'ru'),
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const htmlContent = useMemo(() => formatContent(data?.content ?? ''), [data?.content]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-md flex-col">
        <header className="mb-4">
          <h1 className="text-[56px] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('profile.termsTitle', { defaultValue: 'Пользовательское соглашение' })}
          </h1>
          <p className="mt-1.5 text-[18px] leading-tight text-white/60">
            {t('profile.termsDescription', { defaultValue: 'Соглашения и правила сервиса' })}
          </p>
        </header>

        <section className="border-emerald-200/12 bg-emerald-950/22 min-h-0 flex-1 overflow-hidden rounded-3xl border backdrop-blur-md">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
            </div>
          ) : (
            <div className="text-white/88 h-full overflow-y-auto px-4 py-4 text-[14px] leading-6">
              {htmlContent ? (
                <div
                  className="prose prose-invert max-w-none [&_a]:text-[#52ecc6] [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <p className="text-white/60">
                  {t('info.noContent', { defaultValue: 'Контент не заполнен' })}
                </p>
              )}
            </div>
          )}
        </section>

        <div className="mt-3">
          <UltimaBottomNav active="profile" onProfileClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  );
}
