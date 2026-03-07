import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import type { AppConfig, LocalizedText, RemnawaveAppClient } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

type Step = 1 | 2 | 3;

type UltimaConnectionProps = {
  appConfig: AppConfig;
  onOpenDeepLink: (url: string) => void;
  onGoBack: () => void;
};

const ULTIMA_CONNECTION_STATE_KEY = 'ultima_connection_flow_v1';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M15.5 5 8.5 12l7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
    <path
      d="M12 4.5v8m0 0 3-3m-3 3-3-3M6 15.5v1A2.5 2.5 0 0 0 8.5 19h7a2.5 2.5 0 0 0 2.5-2.5v-1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
    <path
      d="M12 5.5v13m6.5-6.5h-13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
    <path
      d="m6.7 12.2 3.6 3.6 7.1-7.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getLocalizedText = (text: LocalizedText | undefined, lang: string): string => {
  if (!text) return '';
  return text[lang] || text.en || text.ru || Object.values(text)[0] || '';
};

const detectPlatformKey = (): string | null => {
  if (typeof window === 'undefined' || !navigator?.userAgent) return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return /tv|television/.test(ua) ? 'androidTV' : 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return null;
};

const resolveTemplateUrl = (value: string, subscriptionUrl: string | null): string => {
  if (!value) return value;
  if (value.includes('{{subscriptionUrl}}')) {
    return value.split('{{subscriptionUrl}}').join(subscriptionUrl ?? '');
  }
  return value;
};

const findSetupUrls = (
  appConfig: AppConfig,
  language: string,
): {
  installUrl: string | null;
  addSubscriptionUrl: string | null;
} => {
  const platforms = Object.entries(appConfig.platforms ?? {});
  if (!platforms.length) return { installUrl: null, addSubscriptionUrl: null };

  const detected = detectPlatformKey();
  const pickedPlatform =
    (detected && appConfig.platforms[detected]) ||
    appConfig.platforms.android ||
    appConfig.platforms.ios ||
    platforms[0]?.[1];

  const apps = pickedPlatform?.apps ?? [];
  const app: RemnawaveAppClient | undefined = apps.find((entry) => entry.featured) ?? apps[0];
  if (!app) return { installUrl: null, addSubscriptionUrl: null };

  const flatButtons = app.blocks.flatMap((block) => block.buttons ?? []);
  let installUrl: string | null = null;
  let addSubscriptionUrl: string | null = app.deepLink ?? null;

  for (const button of flatButtons) {
    const localized = getLocalizedText(button.text, language).toLowerCase();
    const rawUrl = button.resolvedUrl || button.url || button.link || null;
    if (!rawUrl) continue;

    if (!addSubscriptionUrl && button.type === 'subscriptionLink') {
      addSubscriptionUrl = rawUrl;
    }

    if (
      !addSubscriptionUrl &&
      (localized.includes('подпис') || localized.includes('subscription'))
    ) {
      addSubscriptionUrl = rawUrl;
    }

    if (
      !installUrl &&
      (localized.includes('установ') ||
        localized.includes('download') ||
        localized.includes('play') ||
        localized.includes('store') ||
        localized.includes('apk'))
    ) {
      installUrl = rawUrl;
    }

    if (!installUrl) {
      installUrl = rawUrl;
    }
  }

  const resolvedInstall = installUrl
    ? resolveTemplateUrl(installUrl, appConfig.subscriptionUrl)
    : null;
  const resolvedAdd = addSubscriptionUrl
    ? resolveTemplateUrl(addSubscriptionUrl, appConfig.subscriptionUrl)
    : appConfig.subscriptionUrl;

  return { installUrl: resolvedInstall, addSubscriptionUrl: resolvedAdd };
};

export function UltimaConnection({ appConfig, onOpenDeepLink, onGoBack }: UltimaConnectionProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<Step>(1);
  const [showInfo, setShowInfo] = useState(true);
  const [burst, setBurst] = useState(0);

  const setupUrls = useMemo(
    () => findSetupUrls(appConfig, i18n.language || 'ru'),
    [appConfig, i18n.language],
  );

  useEffect(() => {
    const key = `${ULTIMA_CONNECTION_STATE_KEY}:${user?.id ?? 'guest'}`;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? Number(raw) : 1;
      const normalized: Step = parsed === 3 ? 3 : parsed === 2 ? 2 : 1;
      setStep(normalized);
      setShowInfo(normalized === 1);
    } catch {
      setStep(1);
      setShowInfo(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const key = `${ULTIMA_CONNECTION_STATE_KEY}:${user?.id ?? 'guest'}`;
    try {
      localStorage.setItem(key, String(step));
    } catch {
      // ignore persistence errors
    }
  }, [step, user?.id]);

  useEffect(() => {
    if (step === 3) {
      setBurst((prev) => prev + 1);
    }
  }, [step]);

  const title =
    step === 1
      ? t('subscription.connection.stepInstallTitle', { defaultValue: 'Приложение' })
      : step === 2
        ? t('subscription.connection.stepSubscriptionTitle', { defaultValue: 'Подписка' })
        : t('subscription.connection.stepDoneTitle', { defaultValue: 'Готово!' });

  const subtitle =
    step === 1
      ? t('subscription.connection.stepInstallDesc', {
          defaultValue: 'Установите приложение Happ и вернитесь к этому экрану',
        })
      : step === 2
        ? t('subscription.connection.stepSubscriptionDesc', {
            defaultValue: 'Добавьте подписку в приложении Happ с помощью кнопки ниже',
          })
        : t('subscription.connection.stepDoneDesc', {
            defaultValue: 'Нажмите на круглую кнопку включения VPN в приложении Happ',
          });

  const icon = step === 1 ? <DownloadIcon /> : step === 2 ? <PlusIcon /> : <CheckIcon />;

  const openInstall = () => {
    if (setupUrls.installUrl) {
      onOpenDeepLink(setupUrls.installUrl);
    }
  };

  const openAddSubscription = () => {
    if (setupUrls.addSubscriptionUrl) {
      onOpenDeepLink(setupUrls.addSubscriptionUrl);
    }
  };

  const advanceStep = () => {
    setStep((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  const finishFlow = () => {
    setStep(1);
    setShowInfo(false);
    onGoBack();
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-md flex-col">
        <button
          type="button"
          onClick={onGoBack}
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85"
          aria-label="ultima-connection-back"
        >
          <BackIcon />
        </button>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="pt-2 text-center">
            <h1 className="text-[52px] font-semibold leading-[0.92] text-white sm:text-[56px]">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-[330px] text-[26px] leading-[1.16] text-white/75">
              {subtitle}
            </p>
          </div>

          <div className="relative mt-10 flex flex-1 items-center justify-center">
            <div className="pointer-events-none absolute h-[340px] w-[340px] rounded-full border border-emerald-200/25" />
            <div className="pointer-events-none absolute h-[250px] w-[250px] rounded-full border border-emerald-200/20" />
            <div className="pointer-events-none absolute h-[170px] w-[170px] rounded-full border border-emerald-300/70" />
            <div className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full bg-black/10">
              {icon}
              {step === 3 && (
                <div className="pointer-events-none absolute inset-0 overflow-visible">
                  {Array.from({ length: 32 }).map((_, index) => {
                    const angle = (index * 360) / 32;
                    const distance = 60 + ((index * 11) % 95);
                    const hue = (index * 37) % 360;
                    return (
                      <span
                        key={`${burst}-${index}`}
                        className="absolute left-1/2 top-1/2 h-2.5 w-1.5 rounded-sm"
                        style={{
                          background: `hsl(${hue} 95% 62%)`,
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${distance}px)`,
                          animation: 'ultima-confetti-fall 920ms ease-out forwards',
                          opacity: 0,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pb-1">
          {step === 1 && (
            <button
              type="button"
              onClick={openInstall}
              className="mb-3 flex w-full items-center justify-center rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
            >
              {t('subscription.connection.installApp', { defaultValue: 'Установить приложение' })}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={openAddSubscription}
              className="mb-3 flex w-full items-center justify-center rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
            >
              {t('subscription.connection.addSubscription', { defaultValue: 'Добавить подписку' })}
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={finishFlow}
              className="mb-3 flex w-full items-center justify-center rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
            >
              {t('subscription.connection.finishSetup', { defaultValue: 'Завершить настройку' })}
            </button>
          )}

          <button
            type="button"
            onClick={advanceStep}
            className="mb-3 flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-4 text-[18px] font-medium text-white/95"
          >
            {t('subscription.connection.nextStep', { defaultValue: 'Следующий шаг' })}
          </button>

          <UltimaBottomNav active="connection" />
        </section>
      </div>

      {step === 1 && showInfo && (
        <div className="absolute inset-x-4 bottom-[140px] z-20 rounded-[28px] border border-white/10 bg-black/85 p-5 text-white shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-[30px] font-semibold leading-[1.04]">
              {t('subscription.connection.importantInfo', { defaultValue: 'Важная информация' })}
            </h3>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70"
              aria-label="close-info-modal"
            >
              ×
            </button>
          </div>
          <p className="text-[22px] leading-[1.24] text-white/85">
            {t('subscription.connection.importantInfoDesc', {
              defaultValue:
                'После установки приложения Happ, обязательно вернитесь на этот экран и нажмите «Следующий шаг», чтобы добавить конфигурацию в приложение.',
            })}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowInfo(false);
              openInstall();
            }}
            className="mt-5 flex w-full items-center justify-center rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
          >
            {t('subscription.connection.goInstall', {
              defaultValue: 'Хорошо, перейти к установке',
            })}
          </button>
        </div>
      )}
    </div>
  );
}
