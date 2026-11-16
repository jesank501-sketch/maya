import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, MessageCircle, Pencil, User, X } from 'lucide-react';
import { Profile, RedirectMode } from '../types';
import { getDirectAnchorAttributes } from '../utils/directLink';

interface ProfileDetailModalProps {
  profile: Profile | null;
  messageUrl: string;
  redirectMode: RedirectMode;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (profile: Profile) => void;
  onAfterDirectClick: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  messageUrl,
  redirectMode,
  isAdmin,
  onClose,
  onEdit,
  onAfterDirectClick,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const anchorProps = getDirectAnchorAttributes(redirectMode);

  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          key="profile-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          onClick={onClose}
        >
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-12 items-stretch">
              <div className="md:col-span-5 bg-stone-100 relative min-h-[260px]">
                {!imgFailed && profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6">
                    <User className="w-12 h-12 text-stone-400 mb-2" aria-hidden="true" />
                    <span className="text-sm text-stone-600">{profile.name}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 p-6 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 id="profile-modal-title" className="text-2xl font-bold text-stone-900">
                        {profile.name}, <span className="tabular-nums">{profile.age}</span>
                      </h2>
                      {profile.verified && (
                        <BadgeCheck className="w-5 h-5 text-[#1877F2]" aria-hidden="true" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-stone-500">
                      <span className="font-semibold text-rose-700">
                        {profile.relationshipStatus || 'সিঙ্গেল'}
                      </span>{' '}
                      · {profile.city} · {profile.profession} ·{' '}
                      <span className="tabular-nums">{profile.mutualFriends} কমন ফ্রেন্ড</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="বন্ধ করুন"
                    className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-sm text-stone-700 leading-relaxed">
                  <p>{profile.fullBio}</p>
                </div>

                <dl className="mt-5 pt-4 border-t border-stone-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-stone-500">শিক্ষাগত যোগ্যতা</dt>
                    <dd className="mt-0.5 font-semibold text-stone-900">{profile.education}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">উচ্চতা ও স্ট্যাটাস</dt>
                    <dd className="mt-0.5 font-semibold text-stone-900 tabular-nums">
                      {profile.height} · {profile.availabilityLabel}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-stone-500">আগ্রহ ও শখ</dt>
                    <dd className="mt-0.5 font-medium text-stone-800">
                      {profile.interests.join(' · ')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 pt-4 border-t border-stone-100 space-y-2.5">
                  <motion.a
                    href={messageUrl}
                    {...anchorProps}
                    onClick={() => setTimeout(onAfterDirectClick, 80)}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{profile.messageLabel || 'Message Me'}</span>
                  </motion.a>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(profile);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>এই প্রোফাইলের বায়ো কাস্টমাইজ করুন</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
