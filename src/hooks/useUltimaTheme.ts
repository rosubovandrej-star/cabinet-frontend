import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminSettingsApi, type SettingDefinition } from '../api/adminSettings';
import type { AnimationConfig } from '@/components/ui/backgrounds/types';
import { DEFAULT_ANIMATION_CONFIG } from '@/components/ui/backgrounds/types';

export interface UltimaThemeConfig {
  accent: string;
  accentHover: string;
  text: string;
  bg: string;
  bgImage: string;
  borderRadius: string;
  layout: string;
  animation: AnimationConfig;
}

export const DEFAULT_ULTIMA_THEME: UltimaThemeConfig = {
  accent: '#14cf9a',
  accentHover: '#16d8a1',
  text: '#ffffff',
  bg: '#0c2d2a',
  bgImage: 'none',
  borderRadius: '9999px',
  layout: 'centered', // 'centered' or 'full'
  animation: {
    ...DEFAULT_ANIMATION_CONFIG,
    enabled: false,
    type: 'none',
  },
};

function parseThemeSettings(settings: SettingDefinition[]): UltimaThemeConfig {
  const theme = { ...DEFAULT_ULTIMA_THEME };

  try {
    const jsonSetting = settings.find((s) => s.key === 'ULTIMA_THEME_JSON');
    if (jsonSetting?.current) {
      const parsed = typeof jsonSetting.current === 'string' ? JSON.parse(jsonSetting.current) : jsonSetting.current;
      return { ...theme, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse ULTIMA_THEME_JSON', e);
  }

  return theme;
}

export function useUltimaTheme() {
  const { data: allSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
    staleTime: 60000,
  });

  const theme = parseThemeSettings(allSettings ?? []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ultima-accent', theme.accent);
    root.style.setProperty('--ultima-accent-hover', theme.accentHover);
    root.style.setProperty('--ultima-text', theme.text);
    root.style.setProperty('--ultima-bg', theme.bg);
    root.style.setProperty('--ultima-bg-image', theme.bgImage);
    root.style.setProperty('--ultima-radius', theme.borderRadius);
    
    if (theme.layout === 'full') {
      root.classList.add('ultima-layout-full');
    } else {
      root.classList.remove('ultima-layout-full');
    }

    return () => {
      // Cleanup is optional, but good practice
    };
  }, [theme]);

  return { theme };
}
