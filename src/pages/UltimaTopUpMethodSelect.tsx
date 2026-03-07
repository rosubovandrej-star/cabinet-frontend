import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import PaymentMethodIcon from '@/components/PaymentMethodIcon';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

export function UltimaTopUpMethodSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatAmount, currencySymbol } = useCurrency();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const handleMethodClick = (methodId: string) => {
    const params = new URLSearchParams();
    const amount = searchParams.get('amount');
    const returnTo = searchParams.get('returnTo');
    if (amount) params.set('amount', amount);
    if (returnTo) params.set('returnTo', returnTo);
    const qs = params.toString();
    navigate(`/balance/top-up/${methodId}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-md flex-col">
        <header className="mb-3">
          <h1 className="text-[44px] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('balance.selectPaymentMethod', { defaultValue: 'Способ оплаты' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('balance.ultimaBalanceNotice', {
              defaultValue:
                'При пополнении средства зачисляются на баланс и затем учитываются в стоимости подписки.',
            })}
          </p>
        </header>

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/40 border-t-transparent" />
            </div>
          ) : !paymentMethods || paymentMethods.length === 0 ? (
            <div className="text-white/62 py-8 text-center text-sm">
              {t('balance.noPaymentMethods')}
            </div>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const methodKey = method.id.toLowerCase().replace(/-/g, '_');
                const translatedName = t(`balance.paymentMethods.${methodKey}.name`, {
                  defaultValue: '',
                });
                const translatedDesc = t(`balance.paymentMethods.${methodKey}.description`, {
                  defaultValue: '',
                });

                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={!method.is_available}
                    onClick={() => handleMethodClick(method.id)}
                    className="bg-emerald-950/28 flex w-full items-start gap-3 rounded-2xl border border-emerald-200/10 px-3 py-2.5 text-left transition enabled:hover:border-emerald-200/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-100/10 bg-emerald-900/45 text-white/85">
                      <PaymentMethodIcon method={methodKey} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] leading-tight text-white/95">
                        {translatedName || method.name}
                      </p>
                      {(translatedDesc || method.description) && (
                        <p className="mt-0.5 text-[12px] text-white/55">
                          {translatedDesc || method.description}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-white/45">
                        {formatAmount(method.min_amount_kopeks / 100, 0)} -{' '}
                        {formatAmount(method.max_amount_kopeks / 100, 0)} {currencySymbol}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="pt-3">
          <UltimaBottomNav active="profile" />
        </section>
      </div>
    </div>
  );
}
