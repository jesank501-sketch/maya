import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { PopupAdConfig, RedirectMode } from '../types';
import { getDirectAnchorAttributes, sanitizeExternalUrl } from '../utils/directLink';

interface PopupAdModalProps {
  open: boolean;
  popupAd: PopupAdConfig;
  resolvedTargetUrl?: string;
  redirectMode: RedirectMode;
  onClose: () => void;
  onAfterClick: () => void;
}

export const PopupAdModal: React.FC<PopupAdModalProps> = ({
  open,
  popupAd,
  resolvedTargetUrl,
  redirectMode,
  onClose,
  onAfterClick,
}) => {
  const anchorProps = getDirectAnchorAttributes(redirectMode);
  const targetUrl = sanitizeExternalUrl(resolvedTargetUrl || popupAd.targetUrl);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="popup-ad-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-ad-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold text-[#1D4ED8] tracking-wide">
                বিশেষ পপ-আপ অফার
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="পপ-আপ বন্ধ করুন"
                className="p-2 -m-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h2
              id="popup-ad-title"
              className="mt-2 text-2xl font-bold text-stone-900 leading-snug"
            >
              {popupAd.title}
            </h2>

            <p className="mt-2 text-base font-semibold text-emerald-700">
              {popupAd.offerHighlight}
            </p>

            <p className="mt-3 text-sm text-stone-600 leading-relaxed">
              {popupAd.subtitle}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <motion.a
                href={targetUrl}
                {...anchorProps}
                onClick={() => {
                  setTimeout(() => {
                    onAfterClick();
                    onClose();
                  }, 80);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl transition-colors"
              >
                <span>{popupAd.ctaText}</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </motion.a>

              <motion.a
                href={targetUrl}
                {...anchorProps}
                onClick={() => {
                  setTimeout(() => {
                    onAfterClick();
                    onClose();
                  }, 80);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 min-h-[40px] inline-flex items-center justify-center text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                অফারটি দেখুন ও সরাসরি যান
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
