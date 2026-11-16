import { DirectLinkConfig, RedirectMode } from '../types';
import { DEFAULT_DIRECT_LINKS } from '../data/defaultConfig';

/**
 * Normalizes a URL so external navigation never turns into a relative path.
 */
export function sanitizeExternalUrl(rawUrl: string | undefined): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return DEFAULT_DIRECT_LINKS[0];
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Resolves the exact direct URL for a CTA button.
 * If rotation is enabled and no explicit override forces fixed mode, rotates smoothly
 * across the configured direct links list while guaranteeing a valid URL.
 */
export function resolveDirectUrl(
  overrideUrl: string | undefined,
  config: DirectLinkConfig,
  slotOffset = 0
): string {
  const validLinks = config.links
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
    .map(sanitizeExternalUrl);

  const pool = validLinks.length > 0 ? validLinks : DEFAULT_DIRECT_LINKS;

  if (overrideUrl && overrideUrl.trim().length > 0 && !config.rotationEnabled) {
    return sanitizeExternalUrl(overrideUrl);
  }

  if (config.rotationEnabled) {
    const idx = (config.activeIndex + slotOffset) % pool.length;
    return pool[idx];
  }

  if (overrideUrl && overrideUrl.trim().length > 0) {
    return sanitizeExternalUrl(overrideUrl);
  }

  return pool[slotOffset % pool.length];
}

/**
 * Returns native HTML anchor attributes so browsers NEVER trigger popup-blockers.
 * Using native <a> elements without e.preventDefault() ensures every click
 * navigates directly to the destination URL reliably.
 */
export function getDirectAnchorAttributes(mode: RedirectMode) {
  if (mode === 'same-tab') {
    return {
      target: '_self' as const,
      rel: 'noopener noreferrer',
      referrerPolicy: 'no-referrer' as const,
    };
  }
  return {
    target: '_blank' as const,
    rel: 'noopener noreferrer',
    referrerPolicy: 'no-referrer' as const,
  };
}
