import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { useAuthStore } from '@/store/auth';

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M5 17.5V12a7 7 0 1 1 14 0v5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M8 17.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

type SectionItem = {
  key: string;
  title: string;
  subtitle: string;
  path: string;
  icon: string;
};

function MenuItem({ item, onClick }: { item: SectionItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-[#7beacc]/14 hover:border-[#8ef1d5]/28 flex w-full items-center gap-3 rounded-2xl border bg-emerald-950/35 px-3 py-2.5 text-left transition"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80">
        <span className="text-base">{item.icon}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[18px] leading-tight text-white">{item.title}</p>
        <p className="truncate text-[13px] text-white/55">{item.subtitle}</p>
      </div>
    </button>
  );
}

export function UltimaProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [idCopied, setIdCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const userLabel = useMemo(() => {
    const fallback = user?.telegram_id ?? user?.id ?? 0;
    return `id: ${fallback}`;
  }, [user?.id, user?.telegram_id]);

  const subscriptionLink = subscriptionResponse?.subscription?.subscription_url ?? '';

  const profileItems: SectionItem[] = [
    {
      key: 'payment',
      title: t('profile.paymentMethodsTitle', { defaultValue: 'Способы оплаты' }),
      subtitle: t('profile.paymentMethodsDescription', {
        defaultValue: 'Настройка способов оплаты',
      }),
      path: '/balance/top-up',
      icon: '💳',
    },
    {
      key: 'history',
      title: t('profile.transactionsTitle', { defaultValue: 'История операций' }),
      subtitle: t('profile.transactionsDescription', { defaultValue: 'Список ваших транзакций' }),
      path: '/balance',
      icon: '☰',
    },
    {
      key: 'referral',
      title: t('profile.referralTitle', { defaultValue: 'Реферальная программа' }),
      subtitle: t('profile.referralDescription', {
        defaultValue: 'Получайте бонусы за приглашения',
      }),
      path: '/referral',
      icon: '💚',
    },
    {
      key: 'linking',
      title: t('profile.accountLinkingTitle', { defaultValue: 'Сохранение доступа' }),
      subtitle: t('profile.accountLinkingDescription', {
        defaultValue: 'На случай блокировки Telegram',
      }),
      path: '/account-linking',
      icon: '🛡️',
    },
  ];

  const supportItems: SectionItem[] = [
    {
      key: 'connect',
      title: t('profile.connectOtherDeviceTitle', {
        defaultValue: 'Установка на другом устройстве',
      }),
      subtitle: t('profile.connectOtherDeviceDescription', {
        defaultValue: 'Подробная инструкция для установки',
      }),
      path: '/connection',
      icon: '🖥️',
    },
    {
      key: 'support',
      title: t('profile.supportContactTitle', { defaultValue: 'Связаться с поддержкой' }),
      subtitle: t('profile.supportContactDescription', { defaultValue: 'Решение проблем онлайн' }),
      path: '/support',
      icon: '💬',
    },
    {
      key: 'terms',
      title: t('profile.termsTitle', { defaultValue: 'Пользовательское соглашение' }),
      subtitle: t('profile.termsDescription', { defaultValue: 'Соглашения и правила сервиса' }),
      path: '/info',
      icon: '📄',
    },
  ];

  const copyText = async (value: string, setDone: (value: boolean) => void) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col">
        <section className="border-[#5de7c2]/18 mb-3 flex items-center gap-3 rounded-3xl border bg-[rgba(12,45,42,0.24)] px-3 py-2.5 backdrop-blur-md">
          <div className="h-10 w-10 rounded-full bg-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white/85">{userLabel}</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80"
            onClick={() => void copyText(String(user?.telegram_id ?? user?.id ?? ''), setIdCopied)}
            aria-label="copy-user-id"
          >
            <CopyIcon />
          </button>
          {idCopied ? <span className="text-xs text-emerald-200">OK</span> : null}
        </section>

        <section className="border-[#5de7c2]/18 mb-3 rounded-3xl border bg-[rgba(12,45,42,0.24)] p-3 backdrop-blur-md">
          <p className="mb-2 text-[15px] text-white/70">
            {t('profile.profileSettings', { defaultValue: 'Настройки профиля' })}
          </p>
          <div className="space-y-2">
            {profileItems.map((item) => (
              <MenuItem key={item.key} item={item} onClick={() => navigate(item.path)} />
            ))}
          </div>
        </section>

        <section className="border-[#5de7c2]/18 rounded-3xl border bg-[rgba(12,45,42,0.24)] p-3 backdrop-blur-md">
          <p className="mb-2 text-[15px] text-white/70">
            {t('nav.support', { defaultValue: 'Поддержка' })}
          </p>
          <div className="space-y-2">
            {supportItems.map((item) => (
              <MenuItem key={item.key} item={item} onClick={() => navigate(item.path)} />
            ))}
          </div>
        </section>

        <section className="mt-auto pt-3">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/25 bg-white px-4 py-3 text-slate-900">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{subscriptionLink || '-'}</p>
              <p className="text-xs text-slate-500">
                {t('profile.subscriptionLink', { defaultValue: 'Ваша ссылка на подписку' })}
              </p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
              onClick={() => void copyText(subscriptionLink, setLinkCopied)}
              aria-label="copy-subscription-link"
            >
              <CopyIcon />
            </button>
            {linkCopied ? <span className="text-xs text-emerald-600">OK</span> : null}
          </div>

          <nav className="border-white/14 grid grid-cols-4 gap-2 rounded-full border bg-emerald-900/45 p-2 text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/')}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/connection')}
            >
              <GearIcon />
            </button>
            <button
              type="button"
              className="rounded-full border border-[#59f0c9]/35 bg-[#14cf9a] p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              onClick={() => navigate('/profile')}
            >
              <ProfileIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/support')}
            >
              <SupportIcon />
            </button>
          </nav>
        </section>
      </div>
    </div>
  );
}
