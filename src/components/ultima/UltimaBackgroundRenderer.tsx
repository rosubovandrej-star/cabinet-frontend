import { Suspense, useMemo } from 'react';
import type { AnimationConfig, BackgroundType } from '@/components/ui/backgrounds/types';
import { backgroundComponents } from '@/components/ui/backgrounds/registry';

// Reduce density of animations to save battery on mobile devices.
function reduceMobileSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const reduced = { ...settings };
  if (typeof reduced.particleCount === 'number')
    reduced.particleCount = Math.floor((reduced.particleCount as number) / 2);
  if (typeof reduced.particleDensity === 'number')
    reduced.particleDensity = Math.floor((reduced.particleDensity as number) / 2);
  if (typeof reduced.number === 'number')
    reduced.number = Math.floor((reduced.number as number) / 2);
  if ('interactive' in reduced) reduced.interactive = false;
  return reduced;
}

export interface UltimaBackgroundRendererProps {
  config?: AnimationConfig;
}

export function UltimaBackgroundRenderer({ config }: UltimaBackgroundRendererProps) {
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  if (!config || !config.enabled || config.type === 'none' || prefersReducedMotion) {
    return null;
  }

  const bgType = config.type as Exclude<BackgroundType, 'none'>;
  const Component = backgroundComponents[bgType];

  if (!Component) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const settings =
    config.reducedOnMobile && isMobile
      ? reduceMobileSettings(config.settings)
      : config.settings;

  // Render behind the dashboard but above the solid background
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-inherit"
      style={{
        zIndex: 0,
        opacity: config.opacity !== undefined ? config.opacity : 1,
        filter: config.blur && config.blur > 0 ? `blur(${config.blur}px)` : undefined,
        contain: 'strict',
        backfaceVisibility: 'hidden',
      }}
    >
      <Suspense fallback={null}>
        <Component settings={settings} />
      </Suspense>
    </div>
  );
}
