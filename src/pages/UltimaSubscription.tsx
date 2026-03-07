import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { subscriptionApi } from '@/api/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import type { Tariff, TariffPeriod } from '@/types';

const Dot = ({ active = false }: { active?: boolean }) => (
  <span
    className={
      active
        ? 'h-5 w-5 rounded-full border-2 border-emerald-400'
        : 'h-2 w-2 rounded-full bg-white/35'
    }
  />
);

export function UltimaSubscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currencySymbol } = useCurrency();

  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    refetchOnMount: 'always',
  });

  const tariffs = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return [] as Tariff[];
    return purchaseOptions.tariffs.filter((tariff) => tariff.is_available);
  }, [purchaseOptions]);

  const deviceLimits = useMemo(() => {
    return [...new Set(tariffs.map((tariff) => Math.max(1, tariff.device_limit)))].sort(
      (a, b) => a - b,
    );
  }, [tariffs]);

  useEffect(() => {
    if (!tariffs.length || !deviceLimits.length) return;
    const current = tariffs.find((tariff) => tariff.is_current) ?? tariffs[0];
    const idx = deviceLimits.findIndex((value) => value === current.device_limit);
    setSelectedDeviceIndex(idx >= 0 ? idx : 0);
  }, [tariffs, deviceLimits]);

  const selectedDeviceLimit =
    deviceLimits[Math.min(selectedDeviceIndex, Math.max(0, deviceLimits.length - 1))] ?? 1;

  const selectedTariff = useMemo(() => {
    if (!tariffs.length) return null;
    const exact = tariffs.find((tariff) => tariff.device_limit === selectedDeviceLimit);
    if (exact) return exact;
    return [...tariffs].sort(
      (a, b) =>
        Math.abs(a.device_limit - selectedDeviceLimit) -
        Math.abs(b.device_limit - selectedDeviceLimit),
    )[0];
  }, [tariffs, selectedDeviceLimit]);

  const displayPeriods = useMemo(() => {
    if (!selectedTariff?.periods?.length) return [] as TariffPeriod[];
    const all = selectedTariff.periods.filter((p) => p.days > 0);

    const pick = (months: number): TariffPeriod | null => {
      const exact = all.find((period) => period.months === months);
      if (exact) return exact;
      const targetDays = months * 30;
      return (
        [...all].sort((a, b) => Math.abs(a.days - targetDays) - Math.abs(b.days - targetDays))[0] ??
        null
      );
    };

    const usedDays = new Set<number>();
    const picked: TariffPeriod[] = [];

    [1, 3, 6, 12].forEach((months) => {
      const period = pick(months);
      if (!period || usedDays.has(period.days)) return;
      usedDays.add(period.days);
      picked.push(period);
    });

    if (picked.length) return picked;
    return [...all].sort((a, b) => a.days - b.days).slice(0, 4);
  }, [selectedTariff]);

  const selectedPeriod = useMemo(() => {
    if (!displayPeriods.length) return null;
    if (selectedPeriodDays) {
      return (
        displayPeriods.find((period) => period.days === selectedPeriodDays) ?? displayPeriods[0]
      );
    }
    return displayPeriods.find((period) => period.months === 6) ?? displayPeriods[0];
  }, [displayPeriods, selectedPeriodDays]);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTariff || !selectedPeriod) throw new Error('No tariff selected');
      return subscriptionApi.purchaseTariff(selectedTariff.id, selectedPeriod.days);
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
      ]);
      navigate('/');
    },
    onError: (err: { response?: { data?: { detail?: string; message?: string } } }) => {
      setError(err.response?.data?.detail || err.response?.data?.message || t('common.error'));
    },
  });

  if (isLoading) return <div className="h-[100dvh] w-full bg-[#08201f]" />;

  if (!selectedTariff || !selectedPeriod) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-dark-200">
        {t('subscription.noTariffsAvailable', { defaultValue: 'Тарифы недоступны' })}
      </div>
    );
  }

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100;
    const value = Number.isInteger(rubles) ? String(rubles) : rubles.toFixed(2);
    return `${value} ${currencySymbol}`;
  };

  const periodLabel = (period: TariffPeriod) => {
    if (period.months === 1) return '1 месяц';
    if (period.months === 3) return '3 месяца';
    if (period.months === 6) return '6 месяцев';
    if (period.months === 12) return '1 год';
    if (period.months > 0) return `${period.months} мес`;
    return `${period.days} дней`;
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_78%_50%,rgba(19,176,132,0.35),rgba(5,20,22,0.98)_58%)] px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <header className="mb-3">
          <h1 className="text-[42px] font-semibold leading-[0.95] text-white">Покупка подписки</h1>
          <p className="mt-2 text-[16px] leading-tight text-white/75">
            Подключайте больше устройств и пользуйтесь сервисом вместе с друзьями и близкими
          </p>
        </header>

        <section className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90">
              {selectedDeviceLimit}
            </span>
            <div>
              <p className="text-[22px] font-medium leading-none text-white">Устройство</p>
              <p className="mt-1 text-[14px] text-white/70">Одновременно в подписке</p>
            </div>
          </div>

          <div className="rounded-2xl bg-black/15 p-3">
            <div className="mb-2 h-1 w-full rounded-full bg-white/20" />
            <div className="flex items-center justify-between px-2">
              {deviceLimits.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`devices-${index + 1}`}
                  onClick={() => setSelectedDeviceIndex(index)}
                  className="inline-flex"
                >
                  <Dot active={index === selectedDeviceIndex} />
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, deviceLimits.length - 1)}
              step={1}
              value={selectedDeviceIndex}
              onChange={(event) => setSelectedDeviceIndex(Number(event.target.value))}
              className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-emerald-400"
              aria-label="devices-slider"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {displayPeriods.map((period) => {
            const active = period.days === selectedPeriod.days;
            return (
              <button
                key={period.days}
                type="button"
                onClick={() => {
                  setSelectedPeriodDays(period.days);
                }}
                className={`rounded-3xl border p-4 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-[#0a2522] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'border-white/12 bg-black/20'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[22px] font-medium text-white">{periodLabel(period)}</span>
                  {active && <span className="text-emerald-300">★</span>}
                </div>
                <p className="text-[42px] font-semibold leading-none text-white">
                  {formatPrice(period.price_kopeks)}
                </p>
                <p className="mt-1 text-[14px] text-white/70">
                  {period.price_per_month_kopeks > 0
                    ? `${formatPrice(period.price_per_month_kopeks)} / мес`
                    : ''}
                </p>
              </button>
            );
          })}
        </section>

        <div className="mt-auto pt-4">
          {error && <p className="mb-3 text-center text-[18px] text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
            className="flex w-full items-center justify-between rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-6 py-4 text-[20px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(10,123,94,0.28)]"
          >
            <span>Оплатить подписку</span>
            <span className="flex items-center gap-2 text-white/95">
              {formatPrice(selectedPeriod.price_kopeks)}
              {selectedPeriod.original_price_kopeks ? (
                <span className="text-[15px] text-white/55 line-through">
                  {formatPrice(selectedPeriod.original_price_kopeks)}
                </span>
              ) : null}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
