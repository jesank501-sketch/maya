import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { ArrowUpRight, MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { AdminLoginModal } from './components/AdminLoginModal';
import { BannerAdBar } from './components/BannerAdBar';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { Header } from './components/Header';
import { PopupAdModal } from './components/PopupAdModal';
import { ProfileCard } from './components/ProfileCard';
import { ProfileDetailModal } from './components/ProfileDetailModal';
import { DEFAULT_SITE_CONFIG } from './data/defaultConfig';
import { ADMIN_EMAIL, auth, googleProvider } from './firebase';
import {
  deleteProfileFromFirestore,
  ensureFirestoreSeeded,
  saveProfileToFirestore,
  saveSiteSettingsToFirestore,
  subscribeToPublicSiteData,
} from './services/firestoreSync';
import { GenderFilter, Profile, SiteConfig } from './types';
import { getDirectAnchorAttributes, resolveDirectUrl } from './utils/directLink';

const STORAGE_KEY = 'porichoy_site_config_v7';

function loadInitialConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    if (!parsed || !Array.isArray(parsed.profiles) || !parsed.directLinks) {
      return DEFAULT_SITE_CONFIG;
    }
    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      directLinks: {
        ...DEFAULT_SITE_CONFIG.directLinks,
        ...parsed.directLinks,
      },
      popupAd: {
        ...DEFAULT_SITE_CONFIG.popupAd,
        ...parsed.popupAd,
      },
      featuredMedia: {
        ...DEFAULT_SITE_CONFIG.featuredMedia,
        ...parsed.featuredMedia,
      },
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(loadInitialConfig);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [topBannerDismissed, setTopBannerDismissed] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [customizerProfileId, setCustomizerProfileId] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Admin Auth & Firebase Sync State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useRef<SiteConfig>(config);
  const wantsAdminRouteRef = useRef(false);

  useEffect(() => {
    configRef.current = config;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota issues safely
    }
  }, [config]);

  // Detect ?admin=1 or #admin in URL on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' || window.location.hash === '#admin') {
      wantsAdminRouteRef.current = true;
    }
  }, []);

  // Listen to Firebase Auth state for Admin verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const verifiedAdmin = Boolean(
        user &&
          user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
          user.emailVerified
      );

      if (verifiedAdmin && user) {
        setIsAdmin(true);
        setAdminUid(user.uid);
        setAdminEmail(user.email || ADMIN_EMAIL);
        setLoginModalOpen(false);
        setLoginError(null);

        try {
          await ensureFirestoreSeeded(configRef.current, user.uid);
        } catch (err) {
          console.error('Seed check error:', err);
        }

        if (wantsAdminRouteRef.current) {
          setCustomizerOpen(true);
          wantsAdminRouteRef.current = false;
        }
      } else {
        setIsAdmin(false);
        setAdminUid(null);
        setAdminEmail(null);
        if (wantsAdminRouteRef.current) {
          setLoginModalOpen(true);
          wantsAdminRouteRef.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to public Firestore profiles & siteSettings in real time
  useEffect(() => {
    const unsubscribe = subscribeToPublicSiteData(
      (profiles) => {
        if (profiles && profiles.length > 0) {
          setConfig((prev) => ({
            ...prev,
            profiles,
          }));
        }
      },
      (settings) => {
        if (settings) {
          setConfig((prev) => ({
            ...prev,
            brandName: settings.brandName || prev.brandName,
            heroTitle: settings.heroTitle || prev.heroTitle,
            heroSubtitle: settings.heroSubtitle || prev.heroSubtitle,
            heroCtaText: settings.heroCtaText || prev.heroCtaText,
            heroImage: settings.heroImage || prev.heroImage,
            bannerAds:
              Array.isArray(settings.bannerAds) && settings.bannerAds.length > 0
                ? settings.bannerAds
                : prev.bannerAds,
            popupAd: settings.popupAd
              ? { ...prev.popupAd, ...settings.popupAd }
              : prev.popupAd,
            directLinks: settings.directLinks
              ? { ...prev.directLinks, ...settings.directLinks }
              : prev.directLinks,
            featuredMedia: settings.featuredMedia
              ? { ...prev.featuredMedia, ...settings.featuredMedia }
              : prev.featuredMedia,
          }));
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Dwell-based Popup Ad trigger (>= 10s dwell rule)
  useEffect(() => {
    if (!config.popupAd.enabled) return;
    const sessionKey = 'porichoy_popup_shown_v7';
    if (sessionStorage.getItem(sessionKey) === '1') return;

    const delayMs = Math.max(10, config.popupAd.delaySeconds || 12) * 1000;
    const timer = window.setTimeout(() => {
      setPopupOpen(true);
      sessionStorage.setItem(sessionKey, '1');
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [config.popupAd.enabled, config.popupAd.delaySeconds]);

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email?.toLowerCase() || '';
      if (email !== ADMIN_EMAIL.toLowerCase() || !cred.user.emailVerified) {
        await signOut(auth);
        setLoginError(
          `দুঃখিত, শুধুমাত্র নির্ধারিত অ্যাডমিন অ্যাকাউন্ট (${ADMIN_EMAIL}) দিয়েই লগইন করা যাবে।`
        );
        return;
      }
      setLoginModalOpen(false);
      setCustomizerOpen(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('popup-closed-by-user')) {
        setLoginError('লগইন পপ-আপ বন্ধ করা হয়েছে। আবার চেষ্টা করুন।');
      } else {
        setLoginError('লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCustomizerOpen(false);
    setIsAdmin(false);
    setAdminUid(null);
    setAdminEmail(null);
  };

  const handleSyncProfile = async (profile: Profile, sortOrder: number) => {
    if (!adminUid) return;
    setIsSaving(true);
    try {
      await saveProfileToFirestore(profile, sortOrder, adminUid);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfileFromDb = async (id: string) => {
    if (!adminUid) return;
    setIsSaving(true);
    try {
      await deleteProfileFromFirestore(id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncSettings = async (nextConfig: SiteConfig) => {
    if (!adminUid) return;
    setIsSaving(true);
    try {
      await saveSiteSettingsToFirestore(nextConfig, adminUid);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncAllToDb = async (nextConfig: SiteConfig) => {
    if (!adminUid) return;
    setIsSaving(true);
    try {
      await saveSiteSettingsToFirestore(nextConfig, adminUid);
      await Promise.all(
        nextConfig.profiles.map((prof, idx) => saveProfileToFirestore(prof, idx, adminUid))
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvanceDirectLink = () => {
    if (!config.directLinks.rotationEnabled || config.directLinks.links.length <= 1) {
      return;
    }
    setConfig((prev) => ({
      ...prev,
      directLinks: {
        ...prev.directLinks,
        activeIndex:
          (prev.directLinks.activeIndex + 1) % Math.max(1, prev.directLinks.links.length),
      },
    }));
  };

  const openAdminAccess = (profileId: string | null = null) => {
    if (isAdmin) {
      setCustomizerProfileId(profileId);
      setCustomizerOpen(true);
    } else {
      setLoginError(null);
      setLoginModalOpen(true);
    }
  };

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return config.profiles.filter((profile) => {
      if (genderFilter !== 'all' && profile.gender !== genderFilter) return false;
      if (!query) return true;
      return (
        profile.name.toLowerCase().includes(query) ||
        profile.city.toLowerCase().includes(query) ||
        profile.profession.toLowerCase().includes(query) ||
        profile.shortBio.toLowerCase().includes(query)
      );
    });
  }, [config.profiles, genderFilter, searchQuery]);

  const topBannerAd = config.bannerAds.find((ad) => ad.placement === 'top');
  const midFeedAds = config.bannerAds.filter((ad) => ad.placement === 'mid-feed' && ad.enabled);

  // Group profiles into chunks of 3 so we can intersperse mid-feed banner ads naturally
  const profileChunks = useMemo(() => {
    const chunks: Profile[][] = [];
    for (let i = 0; i < filteredProfiles.length; i += 3) {
      chunks.push(filteredProfiles.slice(i, i + 3));
    }
    return chunks;
  }, [filteredProfiles]);

  const heroPrimaryUrl = resolveDirectUrl(undefined, config.directLinks, 0);
  const heroMessageUrl = resolveDirectUrl(undefined, config.directLinks, 1);
  const videoDirectUrl = resolveDirectUrl(
    config.featuredMedia?.targetUrl,
    config.directLinks,
    2
  );
  const videoOfferUrl = resolveDirectUrl(
    config.featuredMedia?.offerUrl,
    config.directLinks,
    3
  );
  const popupDirectUrl = resolveDirectUrl(config.popupAd.targetUrl, config.directLinks, 0);
  const heroAnchorProps = getDirectAnchorAttributes(config.directLinks.redirectMode);

  const femaleCount = config.profiles.filter((p) => p.gender === 'female').length;
  const maleCount = config.profiles.filter((p) => p.gender === 'male').length;

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#141417]">
        {/* Top Sponsored Banner Ad */}
        {topBannerAd && !topBannerDismissed && (
          <BannerAdBar
            ad={{
              ...topBannerAd,
              targetUrl: resolveDirectUrl(topBannerAd.targetUrl, config.directLinks, 0),
            }}
            redirectMode={config.directLinks.redirectMode}
            onAfterClick={handleAdvanceDirectLink}
            onDismiss={() => setTopBannerDismissed(true)}
          />
        )}

        {/* Strict 3-Zone Top Bar */}
        <Header
          brandName={config.brandName}
          isAdmin={isAdmin}
          primaryDirectUrl={heroPrimaryUrl}
          redirectMode={config.directLinks.redirectMode}
          onAfterDirectClick={handleAdvanceDirectLink}
          onOpenCustomizer={() => openAdminAccess(null)}
        />

        <main className="flex-1">
          {/* Hero Landing Section */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12 lg:pt-14 lg:pb-14">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 flex flex-col justify-center"
              >
                <p className="text-xs font-semibold tracking-wide text-[#1D4ED8] mb-3">
                  ভেরিফায়েড প্রোফাইল ডিরেক্টরি · সরাসরি কানেকশন
                </p>
                <h1 className="text-[clamp(2rem,3.6vw,3.25rem)] font-bold leading-[1.15] tracking-tight text-stone-900 max-w-xl">
                  {config.heroTitle}
                </h1>
                <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                  {config.heroSubtitle}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <motion.a
                    href={heroPrimaryUrl}
                    {...heroAnchorProps}
                    onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                    whileHover={{ scale: 1.025, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <span>{config.heroCtaText}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </motion.a>

                  <motion.a
                    href={heroMessageUrl}
                    {...heroAnchorProps}
                    onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                    whileHover={{ scale: 1.025, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] text-sm font-semibold text-white bg-[#141417] hover:bg-stone-800 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Message Me</span>
                  </motion.a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6"
              >
                <motion.a
                  href={heroPrimaryUrl}
                  {...heroAnchorProps}
                  onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="block h-full min-h-[280px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-200 group shadow-xs hover:shadow-md transition-shadow"
                  aria-label="প্রোফাইল ডিরেক্টরি অফার দেখুন"
                >
                  {!heroImgFailed && config.heroImage ? (
                    <img
                      src={config.heroImage}
                      alt="ভেরিফায়েড সিঙ্গেল মেম্বার কমিউনিটি"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300 flex items-center justify-center p-8 text-center">
                      <span className="text-lg font-semibold text-stone-700">
                        {config.brandName} প্রিমিয়াম কমিউনিটি
                      </span>
                    </div>
                  )}
                </motion.a>
              </motion.div>
            </div>

            {/* 4-Column Full-Width Summary Strip Directly Below Hero Split */}
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'সিঙ্গেল প্রোফাইল',
                  value: `${config.profiles.length} জন`,
                  tone: 'text-stone-900 tabular-nums',
                },
                {
                  label: 'কানেকশন অপশন',
                  value: 'সরাসরি মেসেজ',
                  tone: 'text-stone-900',
                },
                {
                  label: 'মেম্বার অ্যাক্সেস',
                  value: '১০০% ফ্রি',
                  tone: 'text-emerald-700',
                },
                {
                  label: 'রিডাইরেক্ট মোড',
                  value: 'সরাসরি ডিরেক্ট',
                  tone: 'text-stone-900',
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.14 + i * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -3 }}
                  className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-medium text-stone-500">{stat.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Featured Video Profile Showcase Section (Above Pic/Profile Cards Section) */}
          {config.featuredMedia?.enabled && config.featuredMedia.videoUrl && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 grid md:grid-cols-12 gap-8 items-center shadow-xs"
              >
                <div className="md:col-span-5 flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-[300px] aspect-[9/16] bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 shadow-sm"
                  >
                    <video
                      src={config.featuredMedia.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  <p className="text-xs font-semibold text-[#1D4ED8]">
                    ভিডিও প্রোফাইল · সরাসরি সংযোগ
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                    {config.featuredMedia.title}
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                    {config.featuredMedia.subtitle}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <motion.a
                      href={videoDirectUrl}
                      {...heroAnchorProps}
                      onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                      whileHover={{ scale: 1.025, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{config.featuredMedia.ctaText || 'Message Me'}</span>
                    </motion.a>

                    <motion.a
                      href={videoOfferUrl}
                      {...heroAnchorProps}
                      onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                      whileHover={{ scale: 1.025, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] text-sm font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <span>অফার দেখুন</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            </section>
          )}

          {/* Profiles Pic & Bio Directory Section (Below Video Section) */}
          <section id="profiles" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            <div className="border-t border-stone-200 pt-10">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-5"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                    সিঙ্গেল প্রোফাইল ও সম্পূর্ণ বায়ো ডিটেইল
                  </h2>
                  <p className="mt-1.5 text-sm sm:text-base text-stone-600">
                    প্রতিটি প্রোফাইলের নিচে থাকা “Message Me” বাটনে ক্লিক করে সরাসরি সংযুক্ত হোন।
                  </p>
                </div>

                {isAdmin && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openAdminAccess(null)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>নতুন প্রোফাইল ও ছবি যোগ করুন</span>
                  </motion.button>
                )}
              </motion.div>

              {/* Filter & Search Toolbar */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div
                  className="inline-flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl self-start"
                  role="tablist"
                  aria-label="প্রোফাইল ফিল্টার"
                >
                  <button
                    type="button"
                    onClick={() => setGenderFilter('all')}
                    className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      genderFilter === 'all'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    সব প্রোফাইল ({config.profiles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('female')}
                    className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      genderFilter === 'female'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    মেয়ে ({femaleCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('male')}
                    className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      genderFilter === 'male'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    ছেলে ({maleCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search
                    className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="নাম, শহর বা পেশা দিয়ে খুঁজুন..."
                    className="w-full pl-10 pr-4 py-2.5 min-h-[42px] text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                </div>
              </div>

              {/* Profile Cards Grid with Interspersed Mid-Feed Banner Ads */}
              {filteredProfiles.length === 0 ? (
                <div className="mt-10 bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
                  <p className="text-base font-semibold text-stone-800">
                    কোনো প্রোফাইল খুঁজে পাওয়া যায়নি
                  </p>
                  <p className="text-sm text-stone-500">
                    ফিল্টার পরিবর্তন করে আবার দেখুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGenderFilter('all');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#1877F2] rounded-lg hover:bg-[#166FE5] cursor-pointer"
                  >
                    সব প্রোফাইল দেখুন
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-8">
                  {profileChunks.map((chunk, chunkIndex) => {
                    const midAd = midFeedAds[chunkIndex];
                    return (
                      <React.Fragment key={chunkIndex}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {chunk.map((profile, idxInChunk) => {
                            const globalIdx = chunkIndex * 3 + idxInChunk;
                            const messageUrl = resolveDirectUrl(
                              profile.messageLinkOverride,
                              config.directLinks,
                              globalIdx
                            );

                            return (
                              <ProfileCard
                                key={profile.id}
                                profile={profile}
                                index={idxInChunk}
                                isAdmin={isAdmin}
                                messageUrl={messageUrl}
                                redirectMode={config.directLinks.redirectMode}
                                onViewDetail={(p) => setSelectedProfile(p)}
                                onEditProfile={(p) => openAdminAccess(p.id)}
                                onAfterDirectClick={handleAdvanceDirectLink}
                              />
                            );
                          })}
                        </div>

                        {midAd && (
                          <div id={chunkIndex === 0 ? 'featured-offers' : undefined}>
                            <BannerAdBar
                              ad={{
                                ...midAd,
                                targetUrl: resolveDirectUrl(
                                  midAd.targetUrl,
                                  config.directLinks,
                                  chunkIndex + 1
                                ),
                              }}
                              redirectMode={config.directLinks.redirectMode}
                              onAfterClick={handleAdvanceDirectLink}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* How It Works / Editorial Guide Section */}
          <section id="how-it-works" className="bg-white border-t border-stone-200 py-14">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                    কীভাবে সরাসরি কথা বলবেন ও যুক্ত হবেন
                  </h2>
                  <p className="mt-1.5 text-sm sm:text-base text-stone-600">
                    একই পেজ থেকে ভিডিও ও সিঙ্গেল প্রোফাইল দেখুন এবং এক ক্লিকেই সরাসরি যুক্ত হোন।
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 self-start">
                  <motion.a
                    href={heroPrimaryUrl}
                    {...heroAnchorProps}
                    onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl transition-colors whitespace-nowrap"
                  >
                    <span>এখনই সংযুক্ত হোন</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </motion.a>

                  {isAdmin && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openAdminAccess(null)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#141417] hover:bg-stone-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                      <span>কাস্টমাইজেশন খুলুন</span>
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: '০১. প্রোফাইল বায়ো দেখুন ও বাছুন',
                    desc: 'ফেসবুক ফ্রেন্ড লিস্টের মতো প্রতিটি কার্ডে ছবি, সিঙ্গেল স্ট্যাটাস, শিক্ষা, পেশা, শহর এবং বিস্তারিত বায়ো সাজানো আছে।',
                  },
                  {
                    title: '০২. এক ক্লিকেই Message Me',
                    desc: 'যেকোনো বাটনে, ছবিতে বা পপ-আপ অফারে ক্লিক করলেই কোনো বাধা ছাড়াই সরাসরি সংযুক্ত হওয়ার লিংকে চলে যাবেন।',
                  },
                  {
                    title: '০৩. প্রতিদিন নতুন আপডেট',
                    desc: 'নতুন ভেরিফায়েড প্রোফাইল, ভিডিও পরিচিতি এবং বিশেষ অফারগুলো সরাসরি এখানে নিয়মিত আপডেট করা হয়।',
                  },
                ].map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.36,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -3 }}
                    className="p-6 rounded-2xl bg-[#F8F7F4] border border-stone-200/80 transition-shadow hover:shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-stone-900">{step.title}</h3>
                    <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Quiet Editorial Footer */}
        <footer id="footer" className="bg-[#141417] text-stone-300 border-t border-stone-800 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-lg font-bold text-white">{config.brandName}</p>
              <p className="mt-1 text-xs text-stone-400">
                ভেরিফায়েড সিঙ্গেল প্রোফাইল ও সরাসরি যোগাযোগ ডিরেক্টরি।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-stone-400">
              <a
                href={heroPrimaryUrl}
                {...heroAnchorProps}
                onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                className="hover:text-white transition-colors"
              >
                সরাসরি কথা বলুন
              </a>
              <a
                href={heroMessageUrl}
                {...heroAnchorProps}
                onClick={() => setTimeout(handleAdvanceDirectLink, 80)}
                className="hover:text-white transition-colors"
              >
                Message Me
              </a>
              <button
                type="button"
                onClick={() => setPopupOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                পপ-আপ অফার দেখুন
              </button>
              <button
                type="button"
                onClick={() => openAdminAccess(null)}
                className="text-stone-500 hover:text-stone-200 transition-colors cursor-pointer"
              >
                {isAdmin ? 'কাস্টমাইজ করুন' : 'Admin'}
              </button>
            </div>
          </div>
        </footer>

        {/* Profile Full Bio Detail Modal */}
        <ProfileDetailModal
          profile={selectedProfile}
          isAdmin={isAdmin}
          messageUrl={
            selectedProfile
              ? resolveDirectUrl(selectedProfile.messageLinkOverride, config.directLinks, 0)
              : heroMessageUrl
          }
          redirectMode={config.directLinks.redirectMode}
          onClose={() => setSelectedProfile(null)}
          onEdit={(p) => openAdminAccess(p.id)}
          onAfterDirectClick={handleAdvanceDirectLink}
        />

        {/* Popup Ad Modal */}
        <PopupAdModal
          open={popupOpen}
          popupAd={config.popupAd}
          resolvedTargetUrl={popupDirectUrl}
          redirectMode={config.directLinks.redirectMode}
          onClose={() => setPopupOpen(false)}
          onAfterClick={handleAdvanceDirectLink}
        />

        {/* Admin Google Login Modal */}
        <AdminLoginModal
          open={loginModalOpen}
          loading={loginLoading}
          errorMessage={loginError}
          onGoogleLogin={() => void handleGoogleLogin()}
          onClose={() => setLoginModalOpen(false)}
        />

        {/* Live Customization Studio Drawer (Admin Only) */}
        {isAdmin && (
          <CustomizerDrawer
            open={customizerOpen}
            initialProfileId={customizerProfileId}
            config={config}
            adminEmail={adminEmail}
            isSaving={isSaving}
            onUpdateConfig={setConfig}
            onSyncProfile={handleSyncProfile}
            onDeleteProfileFromDb={handleDeleteProfileFromDb}
            onSyncSettings={handleSyncSettings}
            onSyncAllToDb={handleSyncAllToDb}
            onPreviewPopup={() => {
              setCustomizerOpen(false);
              setPopupOpen(true);
            }}
            onLogout={handleLogout}
            onClose={() => setCustomizerOpen(false)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
