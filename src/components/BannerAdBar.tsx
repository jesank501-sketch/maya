import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { BannerAd, BannerTheme, RedirectMode } from '../types';
import { getDirectAnchorAttributes, sanitizeExternalUrl } from '../utils/directLink';

interface BannerAdBarProps {
  ad: BannerAd;
  redirectMode: RedirectMode;
  onAfterClick?: () => void;
  onDismiss?: () => void;
}

const THEME_STYLES: Record<
  BannerTheme,
  {
    wrapper: string;
    label: string;
    title: string;
    subtitle: string;
    cta: string;
    dismiss: string;
  }
> = {
  obsidian: {
    wrapper: 'bg-[#141417] border-stone-800 text-white',
    label: 'text-stone-400',
    title: 'text-white',
    subtitle: 'text-stone-300',
    cta: 'bg-white text-[#141417] hover:bg-stone-100',
    dismiss: 'text-stone-400 hover:text-white hover:bg-white/10',
  },
  sapphire: {
    wrapper: 'bg-[#1E3A8A] border-[#1E40AF] text-white',
    label: 'text-blue-200',
    title: 'text-white',
    subtitle: 'text-blue-100',
    cta: 'bg-white text-[#1E3A8A] hover:bg-blue-50',
    dismiss: 'text-blue-200 hover:text-white hover:bg-white/10',
  },
  emerald: {
    wrapper: 'bg-[#064E3B] border-[#065F46] text-white',
    label: 'text-emerald-200',
    title: 'text-white',
    subtitle: 'text-emerald-100',
    cta: 'bg-white text-[#064E3B] hover:bg-emerald-50',
    dismiss: 'text-emerald-200 hover:text-white hover:bg-white/10',
  },
  amber: {
    wrapper: 'bg-[#FFFBEB] border-amber-200 text-stone-900',
    label: 'text-amber-800',
    title: 'text-stone-900',
    subtitle: 'text-stone-700',
    cta: 'bg-[#141417] text-white hover:bg-stone-800',
    dismiss: 'text-stone-500 hover:text-stone-900 hover:bg-stone-900/5',
  },
};

export const BannerAdBar: React.FC<BannerAdBarProps> = ({
  ad,
  redirectMode,
  onAfterClick,
  onDismiss,
}) => {
  if (!ad.enabled) return null;

  const styles = THEME_STYLES[ad.theme] || THEME_STYLES.obsidian;
  const targetUrl = sanitizeExternalUrl(ad.targetUrl);
  const anchorProps = getDirectAnchorAttributes(redirectMode);
  const isTop = ad.placement === 'top';

  if (isTop) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`border-b ${styles.wrapper}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className={`text-xs font-medium tracking-wide ${styles.label}`}>
              স্পনসর্ড অফার
            </span>
            <span aria-hidden="true" className={styles.label}>
              ·
            </span>
            <p className={`text-sm font-medium ${styles.title} truncate max-w-2xl`}>
              {ad.title}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.a
              href={targetUrl}
              {...anchorProps}
              onClick={() => {
                if (onAfterClick) setTimeout(onAfterClick, 80);
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 ${styles.cta}`}
            >
              <span>{ad.ctaText}</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </motion.a>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="ব্যানার বন্ধ করুন"
                className={`p-1.5 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${styles.dismiss}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 ${styles.wrapper}`}
    >
      <div className="space-y-1.5 max-w-2xl">
        <p className={`text-xs font-medium ${styles.label}`}>
          বিশেষ বিজ্ঞাপন · ডিরেক্ট অফার
        </p>
        <h3 className={`text-lg sm:text-xl font-semibold leading-snug ${styles.title}`}>
          {ad.title}
        </h3>
        {ad.subtitle && (
          <p className={`text-sm leading-relaxed ${styles.subtitle}`}>{ad.subtitle}</p>
        )}
      </div>

      <div className="shrink-0">
        <motion.a
          href={targetUrl}
          {...anchorProps}
          onClick={() => {
            if (onAfterClick) setTimeout(onAfterClick, 80);
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 ${styles.cta}`}
        >
          <span>{ad.ctaText}</span>
          <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </motion.a>
      </div>
    </motion.div>
  );
};
