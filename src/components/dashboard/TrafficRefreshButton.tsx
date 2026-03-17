import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';

const RefreshIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992V4.356m-1.5 14.294A9 9 0 1 1 21 12"
    />
  </svg>
);

interface TrafficRefreshButtonProps {
  onRefresh: () => void;
  isPending: boolean;
  availableAt: number;
}

// ⚡ Bolt: Извлечение этого компонента из Dashboard.tsx предотвращает перерисовку
// всего Dashboard каждую секунду во время кулдауна кнопки.
// Это значительно улучшает производительность, особенно на слабых устройствах.
const TrafficRefreshButton = memo(function TrafficRefreshButton({
  onRefresh,
  isPending,
  availableAt,
}: TrafficRefreshButtonProps) {
  const { t } = useTranslation();
  const [cooldownLeft, setCooldownLeft] = useState(() =>
    Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    const updateCooldown = () => {
      setCooldownLeft(Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)));
    };

    updateCooldown();
    if (availableAt <= Date.now()) return;

    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [availableAt]);

  const isDisabled = isPending || cooldownLeft > 0;

  return (
    <button
      onClick={onRefresh}
      disabled={isDisabled}
      className="rounded-full p-1 text-dark-400 transition-colors hover:bg-dark-700/50 hover:text-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
      title={cooldownLeft > 0 ? `${cooldownLeft}s` : t('common.refresh')}
      aria-label={t('common.refresh')}
    >
      <RefreshIcon className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
    </button>
  );
});

export default TrafficRefreshButton;
