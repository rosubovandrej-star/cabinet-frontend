import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import { usePlatform } from '@/platform';
import type { PaymentMethod } from '@/types';

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

const OpenIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

export function UltimaTopUpAmount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { methodId } = useParams<{ methodId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { formatAmount, convertAmount, convertToRub, currencySymbol, targetCurrency } =
    useCurrency();
  const { openTelegramLink, openLink } = usePlatform();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: methodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const methods =
    methodsData ?? queryClient.getQueryData<PaymentMethod[]>(['payment-methods']) ?? [];
  const method = methods.find((item) => item.id === methodId);

  const initialAmountRub = searchParams.get('amount')
    ? Number(searchParams.get('amount'))
    : undefined;
  const [amount, setAmount] = useState(() => {
    if (!initialAmountRub || Number.isNaN(initialAmountRub) || initialAmountRub <= 0) return '';
    if (targetCurrency === 'RUB' || targetCurrency === 'IRR')
      return String(Math.ceil(convertAmount(initialAmountRub)));
    return convertAmount(initialAmountRub).toFixed(2);
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(
    method?.options?.[0]?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const minRub = (method?.min_amount_kopeks ?? 0) / 100;
  const maxRub = (method?.max_amount_kopeks ?? 0) / 100;
  const quickRubles = [100, 300, 500, 1000].filter((value) => value >= minRub && value <= maxRub);

  const openPayment = useCallback(
    (url: string) => {
      if (url.includes('t.me/')) {
        openTelegramLink(url);
      } else {
        openLink(url);
      }
    },
    [openLink, openTelegramLink],
  );

  const topUpMutation = useMutation({
    mutationFn: async (amountKopeks: number) => {
      if (!method) throw new Error('method_not_found');
      return balanceApi.createTopUp(amountKopeks, method.id, selectedOption || undefined);
    },
    onSuccess: (result) => {
      setError(null);
      const url = result.payment_url;
      setPaymentUrl(url);
      openPayment(url);
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ??
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message;
      setError(detail || t('common.error'));
    },
  });

  const handleCreatePayment = () => {
    setError(null);
    setPaymentUrl(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('balance.errors.enterAmount'));
      return;
    }
    const rubles = convertToRub(value);
    if (rubles < minRub || rubles > maxRub) {
      setError(t('balance.errors.amountRange', { min: minRub, max: maxRub }));
      return;
    }
    topUpMutation.mutate(Math.round(rubles * 100));
  };

  const handleQuick = (valueRub: number) => {
    const converted =
      targetCurrency === 'RUB' || targetCurrency === 'IRR'
        ? String(Math.round(convertAmount(valueRub)))
        : convertAmount(valueRub).toFixed(2);
    setAmount(converted);
    inputRef.current?.focus();
  };

  const methodName = useMemo(() => {
    if (!method) return '';
    const key = method.id.toLowerCase().replace(/-/g, '_');
    return t(`balance.paymentMethods.${key}.name`, { defaultValue: method.name });
  }, [method, t]);

  if (!method) {
    return <div className="h-[100dvh] w-full bg-transparent" />;
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-md flex-col">
        <header className="mb-3">
          <h1 className="text-[42px] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {methodName}
          </h1>
          <p className="text-white/62 mt-1.5 text-[13px] leading-tight">
            {t('balance.ultimaBalanceNotice', {
              defaultValue:
                'Средства поступят на баланс и автоматически учтутся в стоимости подписки.',
            })}
          </p>
          <p className="mt-1 text-[11px] text-white/45">
            {formatAmount(minRub, 0)} - {formatAmount(maxRub, 0)} {currencySymbol}
          </p>
        </header>

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
          {method.options && method.options.length > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {method.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
                    selectedOption === option.id
                      ? 'bg-emerald-500/12 border-emerald-300/40 text-white'
                      : 'border-emerald-200/10 bg-emerald-950/30 text-white/75'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="text-white/62 mb-2 text-[12px]">{t('balance.enterAmount')}</div>
          <div className="flex gap-2">
            <div className="relative flex-1 rounded-2xl border border-emerald-200/10 bg-emerald-950/30">
              <input
                ref={inputRef}
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-12 w-full bg-transparent px-3 pr-10 text-lg font-semibold text-white outline-none"
                placeholder="0"
                inputMode="decimal"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                {currencySymbol}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreatePayment}
              disabled={topUpMutation.isPending}
              className="rounded-2xl border border-[#52ecc6]/40 bg-[#12cd97] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {t('balance.topUp')}
            </button>
          </div>

          {quickRubles.length > 0 ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {quickRubles.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="rounded-xl border border-emerald-200/10 bg-emerald-950/30 px-2 py-2 text-[13px] text-white/85"
                  onClick={() => handleQuick(value)}
                >
                  {formatAmount(value, 0)}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="bg-red-500/12 mt-3 rounded-xl border border-red-400/30 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {paymentUrl ? (
            <div className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3">
              <p className="text-[13px] text-emerald-100">{t('balance.paymentReady')}</p>
              <button
                type="button"
                onClick={() => openPayment(paymentUrl)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#52ecc6]/40 bg-[#12cd97] px-3 py-2.5 text-sm font-medium text-white"
              >
                <OpenIcon />
                {t('balance.openPaymentPage')}
              </button>
            </div>
          ) : null}
        </section>

        <section className="pt-3">
          <nav className="border-emerald-200/12 bg-emerald-900/42 text-white/78 grid grid-cols-4 gap-2 rounded-full border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/')}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className="rounded-full border border-[#59f0c9]/35 bg-[#14cf9a] p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              onClick={() => navigate('/balance/top-up')}
            >
              <GearIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
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
