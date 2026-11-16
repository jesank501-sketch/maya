import React from 'react';
import { MessageCircle, SlidersHorizontal } from 'lucide-react';
import { RedirectMode } from '../types';
import { getDirectAnchorAttributes } from '../utils/directLink';

interface HeaderProps {
  brandName: string;
  isAdmin: boolean;
  primaryDirectUrl: string;
  redirectMode: RedirectMode;
  onAfterDirectClick: () => void;
  onOpenCustomizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brandName,
  isAdmin,
  primaryDirectUrl,
  redirectMode,
  onAfterDirectClick,
  onOpenCustomizer,
}) => {
  const anchorProps = getDirectAnchorAttributes(redirectMode);

  return (
    <header className="sticky top-0 z-30 bg-[#F8F7F4]/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-md px-1"
        >
          {brandName}
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <a
            href="#profiles"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            প্রোফাইলসমূহ
          </a>
          <a
            href="#featured-offers"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            বিশেষ অফার
          </a>
          <a
            href="#how-it-works"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            নির্দেশিকা
          </a>
          <a
            href="#footer"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            যোগাযোগ
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          {isAdmin ? (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-white bg-[#141417] rounded-lg hover:bg-stone-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>কাস্টমাইজ করুন</span>
            </button>
          ) : (
            <a
              href={primaryDirectUrl}
              {...anchorProps}
              onClick={() => setTimeout(onAfterDirectClick, 80)}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-white bg-[#1877F2] rounded-lg hover:bg-[#166FE5] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2"
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Message Me</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
