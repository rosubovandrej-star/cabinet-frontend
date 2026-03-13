import { useTranslation } from 'react-i18next';
import { useCurrency } from './useCurrency';

export function useApiError() {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();

  const formatPrice = (kopeks: number) => `${formatAmount(kopeks / 100)} ${currencySymbol}`;

  const getErrorMessage = (err: {
    response?: {
      status?: number;
      data?: {
        detail?:
          | string
          | {
              message?: string;
              missing_amount?: number;
              code?: string;
              required?: number;
              balance?: number;
            };
        message?: string;
        missing_amount?: number;
        code?: string;
        required?: number;
        balance?: number;
      };
    };
  }) => {
    const status = err.response?.status;
    const data = err.response?.data;
    const detail = data?.detail;

    // Handle 402 Payment Required - insufficient balance
    if (status === 402) {
      // Try to get missing amount from various places
      let missingAmount: number | undefined;

      if (detail && typeof detail === 'object') {
        missingAmount = detail.missing_amount;
        // Calculate from required - balance if missing_amount not provided
        if (
          missingAmount === undefined &&
          detail.required !== undefined &&
          detail.balance !== undefined
        ) {
          missingAmount = detail.required - detail.balance;
        }
      }

      if (missingAmount === undefined) {
        missingAmount = data?.missing_amount;
        if (
          missingAmount === undefined &&
          data?.required !== undefined &&
          data?.balance !== undefined
        ) {
          missingAmount = data.required - data.balance;
        }
      }

      if (missingAmount !== undefined && missingAmount > 0) {
        return t('lite.insufficientBalance', { amount: formatPrice(missingAmount) });
      }

      // Generic insufficient balance message
      return t('lite.insufficientBalanceGeneric');
    }

    // Handle detail as object
    if (detail && typeof detail === 'object') {
      if (detail.code === 'insufficient_balance' || detail.code === 'insufficient_funds') {
        const missingAmount = detail.missing_amount;
        if (missingAmount !== undefined) {
          return t('lite.insufficientBalance', { amount: formatPrice(missingAmount) });
        }
        return t('lite.insufficientBalanceGeneric');
      }
      if (detail.missing_amount !== undefined) {
        return t('lite.insufficientBalance', { amount: formatPrice(detail.missing_amount) });
      }
      if (detail.message) return detail.message;
    }

    // Handle detail as string
    if (typeof detail === 'string') return detail;

    // Fallback to root level fields
    if (data?.code === 'insufficient_balance' || data?.code === 'insufficient_funds') {
      if (data?.missing_amount !== undefined) {
        return t('lite.insufficientBalance', { amount: formatPrice(data.missing_amount) });
      }
      return t('lite.insufficientBalanceGeneric');
    }
    if (data?.missing_amount !== undefined) {
      return t('lite.insufficientBalance', { amount: formatPrice(data.missing_amount) });
    }
    if (typeof data?.message === 'string') return data.message;

    return t('common.error');
  };

  return { getErrorMessage };
}
