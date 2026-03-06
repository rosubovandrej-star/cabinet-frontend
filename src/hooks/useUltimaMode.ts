import { useQuery } from '@tanstack/react-query';
import { brandingApi } from '@/api/branding';

const ULTIMA_MODE_CACHE_KEY = 'cabinet_ultima_mode';
const ULTIMA_MODE_SYNC_INTERVAL_MS = 15000;

export const getCachedUltimaMode = (): boolean | null => {
  try {
    const cached = localStorage.getItem(ULTIMA_MODE_CACHE_KEY);
    if (cached === null) return null;
    return cached === 'true';
  } catch {
    return null;
  }
};

export const setCachedUltimaMode = (enabled: boolean) => {
  try {
    localStorage.setItem(ULTIMA_MODE_CACHE_KEY, String(enabled));
  } catch {
    // localStorage not available
  }
};

export function useUltimaMode() {
  const cachedValue = getCachedUltimaMode();
  const hasCache = cachedValue !== null;

  const { data: ultimaModeSettings, isLoading } = useQuery({
    queryKey: ['ultima-mode-enabled'],
    queryFn: async () => {
      const result = await brandingApi.getUltimaModeEnabled();
      setCachedUltimaMode(result.enabled);
      return result;
    },
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: ULTIMA_MODE_SYNC_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: 2,
    retryDelay: 1000,
    initialData: hasCache ? () => ({ enabled: cachedValue }) : undefined,
    initialDataUpdatedAt: hasCache
      ? () => {
          return Date.now() - 1000 * 60;
        }
      : undefined,
  });

  const isUltimaMode = ultimaModeSettings?.enabled ?? cachedValue ?? false;
  const isUltimaModeReady = hasCache || !isLoading;

  return { isUltimaMode, isLoading, isUltimaModeReady };
}
