import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, LogIn, X } from 'lucide-react';
import { ADMIN_EMAIL } from '../firebase';

interface AdminLoginModalProps {
  open: boolean;
  loading: boolean;
  errorMessage: string | null;
  onGoogleLogin: () => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  open,
  loading,
  errorMessage,
  onGoogleLogin,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="admin-login-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600">
                <Lock className="w-4 h-4 text-[#1877F2]" aria-hidden="true" />
                <span>অ্যাডমিন অ্যাক্সেস</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="p-2 -m-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <h2 id="admin-login-title" className="mt-3 text-xl font-bold text-stone-900">
              অ্যাডমিন লগইন করুন
            </h2>
            <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
              লাইভ সাইটে নতুন প্রোফাইল যোগ বা এডিট করতে আপনার অ্যাডমিন Google অ্যাকাউন্ট ({ADMIN_EMAIL}) দিয়ে সাইন ইন করুন।
            </p>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={onGoogleLogin}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] text-sm font-semibold text-white bg-[#141417] hover:bg-stone-800 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{loading ? 'লগইন হচ্ছে...' : 'Google দিয়ে লগইন করুন'}</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
