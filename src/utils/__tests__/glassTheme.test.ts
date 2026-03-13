import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getGlassColors } from '../glassTheme.ts';

describe('getGlassColors', () => {
  it('should return correct tokens for dark mode', () => {
    const colors = getGlassColors(true);

    assert.strictEqual(colors.cardBg, 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)');
    assert.strictEqual(colors.cardBorder, 'rgba(255,255,255,0.07)');
    assert.strictEqual(colors.innerBg, 'rgba(255,255,255,0.03)');
    assert.strictEqual(colors.innerBorder, 'rgba(255,255,255,0.04)');
    assert.strictEqual(colors.hoverBg, 'rgba(255,255,255,0.05)');
    assert.strictEqual(colors.hoverBorder, 'rgba(255,255,255,0.08)');
    assert.strictEqual(colors.text, '#fff');
    assert.strictEqual(colors.textSecondary, 'rgba(255,255,255,0.4)');
    assert.strictEqual(colors.textMuted, 'rgba(255,255,255,0.3)');
    assert.strictEqual(colors.textFaint, 'rgba(255,255,255,0.25)');
    assert.strictEqual(colors.textGhost, 'rgba(255,255,255,0.08)');
    assert.strictEqual(colors.trackBg, 'rgba(255,255,255,0.06)');
    assert.strictEqual(colors.trackBorder, 'rgba(255,255,255,0.04)');
    assert.strictEqual(colors.codeBg, 'rgba(255,255,255,0.03)');
    assert.strictEqual(colors.codeBorder, 'rgba(255,255,255,0.04)');
    assert.strictEqual(colors.glowAlpha, '15');
    assert.strictEqual(colors.shadow, 'none');
  });

  it('should return correct tokens for light mode', () => {
    const colors = getGlassColors(false);

    assert.strictEqual(colors.cardBg, 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)');
    assert.strictEqual(colors.cardBorder, 'rgba(0,0,0,0.1)');
    assert.strictEqual(colors.innerBg, 'rgba(0,0,0,0.03)');
    assert.strictEqual(colors.innerBorder, 'rgba(0,0,0,0.06)');
    assert.strictEqual(colors.hoverBg, 'rgba(0,0,0,0.05)');
    assert.strictEqual(colors.hoverBorder, 'rgba(0,0,0,0.1)');
    assert.strictEqual(colors.text, '#1a1a2e');
    assert.strictEqual(colors.textSecondary, 'rgba(0,0,0,0.5)');
    assert.strictEqual(colors.textMuted, 'rgba(0,0,0,0.35)');
    assert.strictEqual(colors.textFaint, 'rgba(0,0,0,0.25)');
    assert.strictEqual(colors.textGhost, 'rgba(0,0,0,0.06)');
    assert.strictEqual(colors.trackBg, 'rgba(0,0,0,0.06)');
    assert.strictEqual(colors.trackBorder, 'rgba(0,0,0,0.06)');
    assert.strictEqual(colors.codeBg, 'rgba(0,0,0,0.04)');
    assert.strictEqual(colors.codeBorder, 'rgba(0,0,0,0.06)');
    assert.strictEqual(colors.glowAlpha, '08');
    assert.strictEqual(colors.shadow, '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)');
  });
});
