import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/api/subscription';
import { useAuthStore } from '@/store/auth';
import { getLiteOnboardingFlowState, markLiteOnboardingStep } from '@/features/lite/onboardingFlow';

const TRIAL_ACTIVATE_CLICK_COOLDOWN_MS = 1500;

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
      <path d="M5 18h.01M19 18h.01M12 20h.01" />
    </svg>
  );
}

export default function LiteTrialOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuthStore();

  const [trialError, setTrialError] = useState<string | null>(null);
  const [isTrialActivationLocked, setIsTrialActivationLocked] = useState(false);
  const trialActivationCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [onboardingFlow, setOnboardingFlow] = useState(() => getLiteOnboardingFlowState(user?.id));

  useEffect(() => {
    setOnboardingFlow(getLiteOnboardingFlowState(user?.id));
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (trialActivationCooldownRef.current) {
        clearTimeout(trialActivationCooldownRef.current);
      }
    };
  }, []);

  const { data: subscriptionResponse, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    refetchOnMount: 'always',
  });

  const { data: trialInfo, isLoading: isTrialInfoLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: subscriptionApi.getTrialInfo,
    enabled:
      !!subscriptionResponse &&
      !(
        !!subscriptionResponse.subscription?.is_active &&
        !subscriptionResponse.subscription?.is_expired
      ),
  });

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasActiveSubscription =
    !!subscription && subscription.is_active && !subscription.is_expired;
  const trialActivated = onboardingFlow.trial_activated;
  const connectionOpened = onboardingFlow.connection_opened;
  const subscriptionAdded = onboardingFlow.subscription_added || hasActiveSubscription;
  const currentStep = subscriptionAdded ? 3 : connectionOpened ? 2 : trialActivated ? 1 : 0;

  const activateTrialMutation = useMutation({
    mutationFn: subscriptionApi.activateTrial,
    onSuccess: () => {
      setTrialError(null);
      setOnboardingFlow(markLiteOnboardingStep('trial_activated', user?.id));
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['appConfig'] });
      refreshUser();
      navigate('/connection?guide=trial&step=2');
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail?.toLowerCase() ?? '';

      if (
        detail.includes('insufficient') ||
        detail.includes('balance') ||
        detail.includes('fund')
      ) {
        setTrialError(t('lite.trialErrors.insufficientBalance', 'Недостаточно средств на балансе'));
        return;
      }

      if (detail.includes('already') || detail.includes('used') || detail.includes('activated')) {
        setTrialError(t('lite.trialErrors.alreadyUsed', 'Пробный период уже был использован'));
        return;
      }

      if (
        detail.includes('unavailable') ||
        detail.includes('forbidden') ||
        detail.includes('disabled')
      ) {
        setTrialError(t('lite.trialErrors.unavailable', 'Пробный период временно недоступен'));
        return;
      }

      setTrialError(t('lite.trialErrors.generic', 'Не удалось активировать пробный период'));
    },
  });

  const handleActivateTrial = useCallback(() => {
    if (activateTrialMutation.isPending || isTrialActivationLocked) return;

    setIsTrialActivationLocked(true);
    trialActivationCooldownRef.current = setTimeout(() => {
      setIsTrialActivationLocked(false);
      trialActivationCooldownRef.current = null;
    }, TRIAL_ACTIVATE_CLICK_COOLDOWN_MS);

    activateTrialMutation.mutate();
  }, [activateTrialMutation, isTrialActivationLocked]);

  const canActivateTrial = !hasActiveSubscription && !!trialInfo?.is_available && !trialActivated;
  const showInstallStep = trialActivated && !subscriptionAdded;

  const title = useMemo(() => {
    if (subscriptionAdded) return t('lite.trialOnboarding.doneTitle', 'Готово!');
    if (showInstallStep) {
      return t('lite.trialOnboarding.installTitle', 'Приложение и подписка');
    }
    return t('lite.trialOnboarding.activateTitle', 'Начните с пробного периода');
  }, [showInstallStep, subscriptionAdded, t]);

  const description = useMemo(() => {
    if (subscriptionAdded) {
      return t(
        'lite.trialOnboarding.doneDescription',
        'Подписка добавлена. Откройте подключение и включите VPN в приложении.',
      );
    }
    if (showInstallStep) {
      return t(
        'lite.trialOnboarding.installDescription',
        'Установите приложение, затем вернитесь и добавьте подписку кнопкой ниже.',
      );
    }
    return t(
      'lite.trialOnboarding.activateDescription',
      'Активируйте триал, чтобы открыть быстрый сценарий подключения.',
    );
  }, [showInstallStep, subscriptionAdded, t]);

  const primaryAction = useMemo(() => {
    if (subscriptionAdded) {
      return {
        label: t('lite.connect', 'Подключиться'),
        onClick: () => navigate('/connection'),
      };
    }
    if (showInstallStep) {
      return {
        label: t('lite.trialOnboarding.goToConnection', 'Добавить подписку'),
        onClick: () => navigate('/connection?guide=trial&step=2'),
      };
    }
    return {
      label: activateTrialMutation.isPending
        ? t('common.loading', 'Загрузка...')
        : t('lite.activateTrial', 'Активировать пробный период'),
      onClick: handleActivateTrial,
    };
  }, [
    activateTrialMutation.isPending,
    handleActivateTrial,
    navigate,
    showInstallStep,
    subscriptionAdded,
    t,
  ]);

  const secondaryAction = useMemo(() => {
    if (showInstallStep) {
      return {
        label: t('lite.trialOnboarding.installApp', 'Установить приложение'),
        onClick: () => navigate('/connection?guide=trial&step=2'),
      };
    }
    return {
      label: t('lite.trialOnboarding.backToHome', 'Вернуться на главную'),
      onClick: () => navigate('/'),
    };
  }, [navigate, showInstallStep, t]);

  if (isSubscriptionLoading || isTrialInfoLoading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent-500/30 border-t-accent-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-accent-500/20 bg-[radial-gradient(120%_140%_at_50%_0%,rgba(16,185,129,0.24),rgba(4,7,22,0.96)_55%)] p-4 min-[360px]:p-5">
      <div className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full border border-accent-400/15" />
      <div className="pointer-events-none absolute -right-24 top-32 h-96 w-96 rounded-full border border-accent-400/10" />
      <div className="pointer-events-none absolute left-1/2 top-36 h-56 w-56 -translate-x-1/2 rounded-full border border-accent-300/20" />

      <div className="relative z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-dark-700/70 bg-dark-900/50 text-dark-100 transition-colors hover:border-dark-500"
          aria-label={t('common.back', 'Назад')}
        >
          <BackIcon />
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-dark-300">
          {t('lite.trialOnboarding.progress', {
            current: currentStep,
            total: 3,
            defaultValue: 'Шаг {{current}} из {{total}}',
          })}
        </span>
      </div>

      <div className="relative z-10 mt-8 text-center">
        <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border border-accent-300/45 bg-accent-500/15 text-accent-100 shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_0_40px_rgba(16,185,129,0.25)]">
          <SparkIcon />
        </div>
        <h1 className="text-2xl font-bold text-dark-50">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-dark-200">{description}</p>
      </div>

      <div className="relative z-10 mt-6 rounded-2xl border border-dark-700/70 bg-dark-900/65 p-4">
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                trialActivated ? 'bg-success-500/20 text-success-300' : 'bg-dark-700 text-dark-300'
              }`}
            >
              {trialActivated ? '✓' : '1'}
            </span>
            <span className="text-dark-100">
              {t('lite.connectHintTrialStep1', 'Активируйте пробный период')}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                connectionOpened
                  ? 'bg-success-500/20 text-success-300'
                  : 'bg-dark-700 text-dark-300'
              }`}
            >
              {connectionOpened ? '✓' : '2'}
            </span>
            <span className="text-dark-100">
              {t('lite.connectHintTrialStep2', 'Откройте раздел «Подключение»')}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                subscriptionAdded
                  ? 'bg-success-500/20 text-success-300'
                  : 'bg-dark-700 text-dark-300'
              }`}
            >
              {subscriptionAdded ? '✓' : '3'}
            </span>
            <span className="text-dark-100">
              {t('lite.connectHintTrialStep3', 'Установите приложение и добавьте подписку')}
            </span>
          </li>
        </ol>
      </div>

      <div className="relative z-10 mt-5 space-y-2">
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={
            activateTrialMutation.isPending ||
            isTrialActivationLocked ||
            (!canActivateTrial && !showInstallStep && !subscriptionAdded)
          }
          className="w-full rounded-2xl border border-white/40 bg-accent-500 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.35)] transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {primaryAction.label}
        </button>
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="w-full rounded-2xl border border-dark-600 bg-dark-900/70 py-3 text-sm font-medium text-dark-100 transition-colors hover:border-dark-500 hover:bg-dark-800"
        >
          {secondaryAction.label}
        </button>
        {trialError && (
          <p className="rounded-xl border border-error-500/30 bg-error-500/10 px-3 py-2 text-xs text-error-300">
            {trialError}
          </p>
        )}
      </div>

      <div className="relative z-10 mt-5 rounded-2xl border border-dark-700/70 bg-dark-900/60 p-3 text-xs text-dark-300">
        {t(
          'lite.trialOnboarding.tip',
          'Если приложения ещё нет, установите его и вернитесь на этот экран. Затем нажмите «Добавить подписку».',
        )}
      </div>
    </div>
  );
}
