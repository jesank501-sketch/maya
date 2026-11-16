import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BadgeCheck, MessageCircle, Pencil, User } from 'lucide-react';
import { Profile, RedirectMode } from '../types';
import { getDirectAnchorAttributes } from '../utils/directLink';

interface ProfileCardProps {
  profile: Profile;
  messageUrl: string;
  redirectMode: RedirectMode;
  isAdmin: boolean;
  index?: number;
  onViewDetail: (profile: Profile) => void;
  onEditProfile: (profile: Profile) => void;
  onAfterDirectClick: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  messageUrl,
  redirectMode,
  isAdmin,
  index = 0,
  onViewDetail,
  onEditProfile,
  onAfterDirectClick,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const anchorProps = getDirectAnchorAttributes(redirectMode);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.38,
        delay: Math.min(index * 0.06, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4 }}
      className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-shadow duration-200 flex flex-col"
    >
      {/* Profile Photo Box */}
      <div className="relative aspect-[4/5] w-full bg-stone-100 overflow-hidden group">
        <a
          href={messageUrl}
          {...anchorProps}
          onClick={() => setTimeout(onAfterDirectClick, 80)}
          className="block w-full h-full focus-visible:outline-none"
          aria-label={`${profile.name} - সরাসরি মেসেজ করুন`}
        >
          {!imgFailed && profile.imageUrl ? (
            <img
              src={profile.imageUrl}
              alt={`${profile.name} - প্রোফাইল ছবি`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 flex flex-col items-center justify-center p-6 text-center">
              <User className="w-12 h-12 text-stone-400 mb-2" aria-hidden="true" />
              <span className="text-sm font-medium text-stone-600">{profile.name}</span>
            </div>
          )}
        </a>

        {/* Quick Edit Trigger on Card (Admin Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onEditProfile(profile)}
            title="এই প্রোফাইলটি কাস্টমাইজ করুন"
            aria-label={`${profile.name} এডিট করুন`}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 border border-stone-200/80 shadow-xs inline-flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Facebook-Friend-List Inspired Bio Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onViewDetail(profile)}
              className="text-left group/name inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:underline"
            >
              <h3 className="text-lg font-bold text-stone-900 group-hover/name:text-[#1D4ED8] transition-colors truncate">
                {profile.name}, <span className="tabular-nums">{profile.age}</span>
              </h3>
              {profile.verified && (
                <BadgeCheck
                  className="w-4 h-4 text-[#1877F2] shrink-0"
                  aria-label="ভেরিফায়েড প্রোফাইল"
                />
              )}
            </button>
          </div>
        </div>

        {/* Unboxed Inline Metadata (Zero-Pill Rule) */}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-stone-500">
          <span className="font-semibold text-rose-700">
            {profile.relationshipStatus || 'সিঙ্গেল'}
          </span>
          <span aria-hidden="true">·</span>
          <span>{profile.city}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.profession}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{profile.mutualFriends} কমন ফ্রেন্ড</span>
        </div>

        {/* Short Bio */}
        <p className="mt-3 text-sm text-stone-700 leading-relaxed line-clamp-2">
          {profile.shortBio}
        </p>

        {/* Structured Friend-List Details */}
        <dl className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-stone-500 shrink-0">শিক্ষা</dt>
            <dd className="text-stone-800 font-medium text-right truncate">
              {profile.education}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-stone-500 shrink-0">উচ্চতা ও অবস্থা</dt>
            <dd className="text-stone-800 font-medium text-right tabular-nums">
              {profile.height} · {profile.relationshipStatus || 'সিঙ্গেল'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-stone-500 shrink-0">স্ট্যাটাস</dt>
            <dd className="text-emerald-700 font-semibold text-right">
              {profile.availabilityLabel}
            </dd>
          </div>
        </dl>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => onViewDetail(profile)}
            className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline underline-offset-4 cursor-pointer"
          >
            সম্পূর্ণ বায়ো ডিটেইল দেখুন
          </button>
        </div>

        {/* Direct-Link Action Button: Message Me */}
        <div className="mt-auto pt-4">
          <motion.a
            href={messageUrl}
            {...anchorProps}
            onClick={() => setTimeout(onAfterDirectClick, 80)}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{profile.messageLabel || 'Message Me'}</span>
          </motion.a>
        </div>
      </div>
    </motion.article>
  );
};
