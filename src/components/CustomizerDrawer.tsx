import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  LogOut,
  Megaphone,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { CURATED_PORTRAITS, DEFAULT_SITE_CONFIG } from '../data/defaultConfig';
import { compressImageFileToDataUrl } from '../services/firestoreSync';
import {
  BannerAd,
  BannerTheme,
  Gender,
  Profile,
  RedirectMode,
  SiteConfig,
} from '../types';
import { sanitizeExternalUrl } from '../utils/directLink';

type CustomizerTab = 'profiles' | 'ads' | 'links' | 'general';

interface CustomizerDrawerProps {
  open: boolean;
  initialProfileId: string | null;
  config: SiteConfig;
  adminEmail: string | null;
  isSaving: boolean;
  onUpdateConfig: (next: SiteConfig) => void;
  onSyncProfile: (profile: Profile, sortOrder: number) => Promise<void>;
  onDeleteProfileFromDb: (id: string) => Promise<void>;
  onSyncSettings: (next: SiteConfig) => Promise<void>;
  onSyncAllToDb: (next: SiteConfig) => Promise<void>;
  onPreviewPopup: () => void;
  onLogout: () => Promise<void>;
  onClose: () => void;
}

export const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({
  open,
  initialProfileId,
  config,
  adminEmail,
  isSaving,
  onUpdateConfig,
  onSyncProfile,
  onDeleteProfileFromDb,
  onSyncSettings,
  onSyncAllToDb,
  onPreviewPopup,
  onLogout,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CustomizerTab>('profiles');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    initialProfileId || config.profiles[0]?.id || ''
  );
  const [newLinkInput, setNewLinkInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);
  const profileDebounceRef = useRef<number | null>(null);
  const settingsDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId);
      setActiveTab('profiles');
    }
  }, [initialProfileId]);

  useEffect(() => {
    return () => {
      if (profileDebounceRef.current) window.clearTimeout(profileDebounceRef.current);
      if (settingsDebounceRef.current) window.clearTimeout(settingsDebounceRef.current);
    };
  }, []);

  const selectedProfile =
    config.profiles.find((p) => p.id === selectedProfileId) || config.profiles[0] || null;

  const showFlash = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => setStatusMessage(null), 2800);
  };

  const scheduleProfileSync = (profile: Profile, sortOrder: number, immediate = false) => {
    if (profileDebounceRef.current) window.clearTimeout(profileDebounceRef.current);
    if (immediate) {
      void onSyncProfile(profile, sortOrder);
      return;
    }
    profileDebounceRef.current = window.setTimeout(() => {
      void onSyncProfile(profile, sortOrder);
    }, 650);
  };

  const scheduleSettingsSync = (nextConfig: SiteConfig, immediate = false) => {
    if (settingsDebounceRef.current) window.clearTimeout(settingsDebounceRef.current);
    if (immediate) {
      void onSyncSettings(nextConfig);
      return;
    }
    settingsDebounceRef.current = window.setTimeout(() => {
      void onSyncSettings(nextConfig);
    }, 650);
  };

  const updateProfileField = <K extends keyof Profile>(
    id: string,
    field: K,
    value: Profile[K],
    immediate = false
  ) => {
    let updatedProfile: Profile | null = null;
    let updatedIndex = 0;

    const nextProfiles = config.profiles.map((p, idx) => {
      if (p.id === id) {
        updatedProfile = { ...p, [field]: value };
        updatedIndex = idx;
        return updatedProfile;
      }
      return p;
    });

    const nextConfig = { ...config, profiles: nextProfiles };
    onUpdateConfig(nextConfig);

    if (updatedProfile) {
      scheduleProfileSync(updatedProfile, updatedIndex, immediate);
    }
  };

  const updateSettingsConfig = (nextConfig: SiteConfig, immediate = false) => {
    onUpdateConfig(nextConfig);
    scheduleSettingsSync(nextConfig, immediate);
  };

  const handleAddProfile = async (gender: Gender) => {
    const newId = `prof-${Date.now()}`;
    const defaultImg =
      gender === 'female' ? CURATED_PORTRAITS[0].url : CURATED_PORTRAITS[1].url;
    const defaultLink = config.directLinks.links[0] || DEFAULT_SITE_CONFIG.directLinks.links[0];
    const newProfile: Profile = {
      id: newId,
      name: gender === 'female' ? 'নতুন প্রোফাইল (মেয়ে)' : 'নতুন প্রোফাইল (ছেলে)',
      age: 23,
      gender,
      city: 'ঢাকা',
      profession: 'শিক্ষার্থী / প্রফেশনাল',
      education: 'স্নাতক',
      height: gender === 'female' ? '৫ ফুট ৪ ইঞ্চি' : '৫ ফুট ৯ ইঞ্চি',
      mutualFriends: 10,
      shortBio: 'নতুন মানুষের সাথে পরিচিত হতে এবং সরাসরি কথা বলতে আগ্রহী।',
      fullBio:
        'এটি একটি কাস্টমাইজযোগ্য বায়ো বিবরণ। আপনি এই অংশে আপনার পছন্দের বিবরণ, শখ এবং যোগাযোগের তথ্য লিখতে পারেন।',
      interests: ['ভ্রমণ', 'আড্ডা', 'সংগীত'],
      imageUrl: defaultImg,
      verified: true,
      relationshipStatus: 'সিঙ্গেল',
      availabilityLabel: 'আজ ফ্রি আছেন',
      messageLabel: 'Message Me',
      messageLinkOverride: defaultLink,
    };

    const nextProfiles = [newProfile, ...config.profiles];
    onUpdateConfig({
      ...config,
      profiles: nextProfiles,
    });
    setSelectedProfileId(newId);
    await onSyncProfile(newProfile, 0);
    showFlash('নতুন প্রোফাইল লাইভ ডাটাবেসে যুক্ত হয়েছে');
  };

  const handleDeleteProfile = async (id: string) => {
    const remaining = config.profiles.filter((p) => p.id !== id);
    onUpdateConfig({ ...config, profiles: remaining });
    setSelectedProfileId(remaining[0]?.id || '');
    await onDeleteProfileFromDb(id);
    showFlash('প্রোফাইল মুছে ফেলা হয়েছে');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, profileId: string) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file);
      if (compressedDataUrl.length > 195000) {
        showFlash('ছবিটি অনেক বড়। অনুগ্রহ করে ছোট ছবি বা ছবির লিংক দিন।');
        return;
      }
      updateProfileField(profileId, 'imageUrl', compressedDataUrl, true);
      showFlash('ছবি কমপ্রেস হয়ে লাইভ সেভ হয়েছে');
    } catch {
      showFlash('ছবি আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateBannerAd = <K extends keyof BannerAd>(
    id: string,
    field: K,
    value: BannerAd[K],
    immediate = false
  ) => {
    const nextConfig: SiteConfig = {
      ...config,
      bannerAds: config.bannerAds.map((ad) => (ad.id === id ? { ...ad, [field]: value } : ad)),
    };
    updateSettingsConfig(nextConfig, immediate);
  };

  const handleAddMidBanner = () => {
    const newAd: BannerAd = {
      id: `ad-mid-${Date.now()}`,
      placement: 'mid-feed',
      enabled: true,
      title: 'নতুন স্পনসর্ড ব্যানার অফার — সরাসরি অ্যাক্সেস ফ্রি',
      subtitle: 'এই ব্যানারে ক্লিক করলে আপনার নির্ধারিত ডিরেক্ট লিংকে নিয়ে যাবে।',
      ctaText: 'এখনই ভিজিট করুন',
      targetUrl: config.directLinks.links[0] || DEFAULT_SITE_CONFIG.directLinks.links[0],
      theme: 'sapphire',
    };
    const nextConfig: SiteConfig = {
      ...config,
      bannerAds: [...config.bannerAds, newAd],
    };
    updateSettingsConfig(nextConfig, true);
    showFlash('নতুন ব্যানার অ্যাড যুক্ত হয়েছে');
  };

  const handleDeleteBannerAd = (id: string) => {
    const nextConfig: SiteConfig = {
      ...config,
      bannerAds: config.bannerAds.filter((ad) => ad.id !== id),
    };
    updateSettingsConfig(nextConfig, true);
    showFlash('ব্যানার অ্যাড মুছে ফেলা হয়েছে');
  };

  const handleAddDirectLink = () => {
    const trimmed = newLinkInput.trim();
    if (!trimmed) return;
    const normalized = sanitizeExternalUrl(trimmed);
    const nextConfig: SiteConfig = {
      ...config,
      directLinks: {
        ...config.directLinks,
        links: [...config.directLinks.links, normalized],
      },
    };
    updateSettingsConfig(nextConfig, true);
    setNewLinkInput('');
    showFlash('নতুন ডিরেক্ট লিংক লাইভ সেভ হয়েছে');
  };

  const handleUpdateDirectLink = (index: number, value: string) => {
    const updated = [...config.directLinks.links];
    updated[index] = value;
    const nextConfig: SiteConfig = {
      ...config,
      directLinks: {
        ...config.directLinks,
        links: updated,
      },
    };
    updateSettingsConfig(nextConfig, false);
  };

  const handleRemoveDirectLink = (index: number) => {
    if (config.directLinks.links.length <= 1) {
      showFlash('অন্তত একটি ডিরেক্ট লিংক থাকতে হবে');
      return;
    }
    const updated = config.directLinks.links.filter((_, idx) => idx !== index);
    const nextConfig: SiteConfig = {
      ...config,
      directLinks: {
        ...config.directLinks,
        links: updated,
        activeIndex: 0,
      },
    };
    updateSettingsConfig(nextConfig, true);
    showFlash('ডিরেক্ট লিংক সরানো হয়েছে');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'porichoy-site-config.json';
    a.click();
    URL.revokeObjectURL(url);
    showFlash('কনফিগারেশন ডাউনলোড হয়েছে');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.profiles) && parsed.directLinks) {
          const merged: SiteConfig = {
            ...DEFAULT_SITE_CONFIG,
            ...parsed,
          };
          onUpdateConfig(merged);
          await onSyncAllToDb(merged);
          showFlash('কনফিগারেশন ইম্পোর্ট ও লাইভ সিঙ্ক হয়েছে');
        } else {
          showFlash('সঠিক কনফিগারেশন ফাইল নির্বাচন করুন');
        }
      } catch {
        showFlash('ফাইল পার্স করতে সমস্যা হয়েছে');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="customizer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="সাইট ও বায়ো কাস্টমাইজেশন প্যানেল"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#FAF9F6] w-full max-w-4xl h-full flex flex-col shadow-2xl border-l border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="bg-white border-b border-stone-200 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                    অ্যাডমিন কাস্টমাইজেশন স্টুডিও
                  </h2>
                  {adminEmail && (
                    <span className="text-[11px] font-medium text-stone-500 font-mono">
                      ({adminEmail})
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  আপনার যেকোনো পরিবর্তন লাইভ ডাটাবেসে সেভ হয় — Netlify-এ সব ভিজিটর সাথে সাথে দেখতে পাবে
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {isSaving ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1877F2]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>সেভ হচ্ছে...</span>
                  </span>
                ) : statusMessage ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{statusMessage}</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>লাইভ সিঙ্কড</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => void onLogout()}
                  title="অ্যাডমিন লগআউট"
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold text-stone-700 hover:text-red-700 hover:bg-red-50 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">লগআউট</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="কাস্টমাইজার বন্ধ করুন"
                  className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-stone-200 px-5 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('profiles')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'profiles'
                    ? 'bg-[#141417] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>প্রোফাইল ও বায়ো ({config.profiles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'ads'
                    ? 'bg-[#141417] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Megaphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>ব্যানার ও পপ-আপ অ্যাড</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('links')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'links'
                    ? 'bg-[#141417] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Link2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>ডিরেক্ট লিংক ({config.directLinks.links.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-[#141417] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>ল্যান্ডিং ও ব্যাকআপ</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {activeTab === 'profiles' && (
                <div className="grid md:grid-cols-12 gap-6 items-start">
                  {/* Left Profile Selector List */}
                  <div className="md:col-span-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAddProfile('female')}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>মেয়ে যোগ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAddProfile('male')}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold bg-[#141417] text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>ছেলে যোগ</span>
                      </button>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden">
                      {config.profiles.map((prof) => {
                        const isActive = selectedProfile?.id === prof.id;
                        return (
                          <button
                            key={prof.id}
                            type="button"
                            onClick={() => setSelectedProfileId(prof.id)}
                            className={`w-full px-3.5 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                              isActive ? 'bg-blue-50/70' : 'hover:bg-stone-50'
                            }`}
                          >
                            <img
                              src={prof.imageUrl}
                              alt={prof.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover object-top bg-stone-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-stone-900 truncate">
                                {prof.name}
                              </p>
                              <p className="text-xs text-stone-500 truncate">
                                {prof.gender === 'female' ? 'মেয়ে' : 'ছেলে'} · {prof.age} বছর · {prof.city}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Profile Editor Form */}
                  <div className="md:col-span-8">
                    {selectedProfile ? (
                      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4">
                          <div>
                            <h3 className="text-base font-bold text-stone-900">
                              প্রোফাইল বায়ো এডিটর: {selectedProfile.name}
                            </h3>
                            <p className="text-xs text-stone-500">
                              যেকোনো পরিবর্তন অটোমেটিক লাইভ ডাটাবেসে সেভ হবে
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProfile(selectedProfile.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>মুছুন</span>
                          </button>
                        </div>

                        {/* Photo Section */}
                        <div className="space-y-2.5">
                          <label className="block text-xs font-semibold text-stone-700">
                            প্রোফাইল ছবি (ইউআরএল অথবা ডিভাইস থেকে আপলোড)
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <img
                              src={selectedProfile.imageUrl}
                              alt={selectedProfile.name}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 rounded-xl object-cover object-top border border-stone-200 bg-stone-100 shrink-0"
                            />
                            <div className="flex-1 min-w-[200px] space-y-2">
                              <input
                                type="text"
                                value={selectedProfile.imageUrl}
                                onChange={(e) =>
                                  updateProfileField(selectedProfile.id, 'imageUrl', e.target.value)
                                }
                                placeholder="ছবির লিংক দিন..."
                                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => void handlePhotoUpload(e, selectedProfile.id)}
                                />
                                <button
                                  type="button"
                                  disabled={uploadingPhoto}
                                  onClick={() => fileInputRef.current?.click()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                                >
                                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{uploadingPhoto ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}</span>
                                </button>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      updateProfileField(
                                        selectedProfile.id,
                                        'imageUrl',
                                        e.target.value,
                                        true
                                      );
                                    }
                                  }}
                                  className="px-2.5 py-1.5 text-xs bg-stone-100 text-stone-800 rounded-lg border border-stone-200 cursor-pointer"
                                >
                                  <option value="">রেডিমেড পোর্ট্রেট বাছুন</option>
                                  {CURATED_PORTRAITS.map((item) => (
                                    <option key={item.url} value={item.url}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Basic Fields */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              নাম
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.name}
                              onChange={(e) =>
                                updateProfileField(selectedProfile.id, 'name', e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                বয়স
                              </label>
                              <input
                                type="number"
                                min={18}
                                max={60}
                                value={selectedProfile.age}
                                onChange={(e) =>
                                  updateProfileField(
                                    selectedProfile.id,
                                    'age',
                                    Number(e.target.value) || 22
                                  )
                                }
                                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                ক্যাটাগরি
                              </label>
                              <select
                                value={selectedProfile.gender}
                                onChange={(e) =>
                                  updateProfileField(
                                    selectedProfile.id,
                                    'gender',
                                    e.target.value as Gender,
                                    true
                                  )
                                }
                                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                              >
                                <option value="female">মেয়ে</option>
                                <option value="male">ছেলে</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              শহর / ঠিকানা
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.city}
                              onChange={(e) =>
                                updateProfileField(selectedProfile.id, 'city', e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              পেশা
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.profession}
                              onChange={(e) =>
                                updateProfileField(selectedProfile.id, 'profession', e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              শিক্ষাগত যোগ্যতা
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.education}
                              onChange={(e) =>
                                updateProfileField(selectedProfile.id, 'education', e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                উচ্চতা
                              </label>
                              <input
                                type="text"
                                value={selectedProfile.height}
                                onChange={(e) =>
                                  updateProfileField(selectedProfile.id, 'height', e.target.value)
                                }
                                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                কমন ফ্রেন্ড
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={selectedProfile.mutualFriends}
                                onChange={(e) =>
                                  updateProfileField(
                                    selectedProfile.id,
                                    'mutualFriends',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              সম্পর্কের অবস্থা
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.relationshipStatus || 'সিঙ্গেল'}
                              onChange={(e) =>
                                updateProfileField(
                                  selectedProfile.id,
                                  'relationshipStatus',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              স্ট্যাটাস টেক্সট
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.availabilityLabel}
                              onChange={(e) =>
                                updateProfileField(
                                  selectedProfile.id,
                                  'availabilityLabel',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              আগ্রহ ও শখ (কমা দিয়ে আলাদা করুন)
                            </label>
                            <input
                              type="text"
                              value={selectedProfile.interests.join(', ')}
                              onChange={(e) =>
                                updateProfileField(
                                  selectedProfile.id,
                                  'interests',
                                  e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            সংক্ষিপ্ত বায়ো (কার্ডের নিচে দেখা যাবে)
                          </label>
                          <textarea
                            rows={2}
                            value={selectedProfile.shortBio}
                            onChange={(e) =>
                              updateProfileField(selectedProfile.id, 'shortBio', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            বিস্তারিত বায়ো (বিস্তারিত মোডালে দেখা যাবে)
                          </label>
                          <textarea
                            rows={3}
                            value={selectedProfile.fullBio}
                            onChange={(e) =>
                              updateProfileField(selectedProfile.id, 'fullBio', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                          />
                        </div>

                        {/* Direct Link Assignment for this Profile */}
                        <div className="pt-4 border-t border-stone-100 space-y-3">
                          <h4 className="text-xs font-bold text-stone-900">
                            Message Me বাটন ও ডিরেক্ট লিংক কাস্টমাইজেশন
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-stone-600 mb-1">
                                বাটনের লেখা
                              </label>
                              <input
                                type="text"
                                value={selectedProfile.messageLabel || 'Message Me'}
                                onChange={(e) =>
                                  updateProfileField(
                                    selectedProfile.id,
                                    'messageLabel',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-stone-600 mb-1">
                                Message Me ডিরেক্ট লিংক
                              </label>
                              <input
                                type="text"
                                value={selectedProfile.messageLinkOverride || ''}
                                onChange={(e) =>
                                  updateProfileField(
                                    selectedProfile.id,
                                    'messageLinkOverride',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-sm text-stone-500">
                        কোনো প্রোফাইল পাওয়া যায়নি। বাম দিক থেকে নতুন প্রোফাইল যোগ করুন।
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'ads' && (
                <div className="space-y-6">
                  {/* Popup Ad Settings */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-stone-900">
                          পপ-আপ অ্যাড সেটিংস
                        </h3>
                        <p className="text-xs text-stone-500">
                          ভিজিটর পেজে কিছু সময় থাকার পর বা স্ক্রল করলে এই পপ-আপ অ্যাডটি দেখাবে
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={onPreviewPopup}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>পপ-আপ প্রিভিউ দেখুন</span>
                        </button>
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.popupAd.enabled}
                            onChange={(e) =>
                              updateSettingsConfig(
                                {
                                  ...config,
                                  popupAd: { ...config.popupAd, enabled: e.target.checked },
                                },
                                true
                              )
                            }
                            className="w-4 h-4 accent-[#1877F2]"
                          />
                          <span>চালু রাখুন</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          পপ-আপ শিরোনাম
                        </label>
                        <input
                          type="text"
                          value={config.popupAd.title}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              popupAd: { ...config.popupAd, title: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          অফার হাইলাইট
                        </label>
                        <input
                          type="text"
                          value={config.popupAd.offerHighlight}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              popupAd: { ...config.popupAd, offerHighlight: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          বিবরণ
                        </label>
                        <textarea
                          rows={2}
                          value={config.popupAd.subtitle}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              popupAd: { ...config.popupAd, subtitle: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          বাটনের লেখা
                        </label>
                        <input
                          type="text"
                          value={config.popupAd.ctaText}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              popupAd: { ...config.popupAd, ctaText: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          কত সেকেন্ড পর দেখাবে (ন্যূনতম ১০ সেকেন্ড)
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={120}
                          value={config.popupAd.delaySeconds}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              popupAd: {
                                ...config.popupAd,
                                delaySeconds: Math.max(10, Number(e.target.value) || 12),
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          পপ-আপ ডিরেক্ট লিংক URL
                        </label>
                        <input
                          type="text"
                          value={config.popupAd.targetUrl}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              popupAd: { ...config.popupAd, targetUrl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner Ads List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-stone-900">
                          টপ ও মিড-ফিড ব্যানার অ্যাডসমূহ
                        </h3>
                        <p className="text-xs text-stone-500">
                          প্রোফাইল লিস্টের উপরে এবং মাঝে মাঝে এই ব্যানারগুলো প্রদর্শিত হয়
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMidBanner}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>নতুন মিড-ফিড ব্যানার</span>
                      </button>
                    </div>

                    {config.bannerAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                          <span className="text-xs font-bold text-stone-800">
                            {ad.placement === 'top' ? 'টপ হেডার ব্যানার অ্যাড' : 'মিড-ফিড ব্যানার অ্যাড'}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ad.enabled}
                                onChange={(e) =>
                                  updateBannerAd(ad.id, 'enabled', e.target.checked, true)
                                }
                                className="w-4 h-4 accent-[#1877F2]"
                              />
                              <span>দৃশ্যমান</span>
                            </label>
                            {ad.placement !== 'top' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBannerAd(ad.id)}
                                className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
                              >
                                মুছুন
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              ব্যানার শিরোনাম
                            </label>
                            <input
                              type="text"
                              value={ad.title}
                              onChange={(e) => updateBannerAd(ad.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>
                          {ad.placement === 'mid-feed' && (
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                ব্যানার উপ-শিরোনাম
                              </label>
                              <input
                                type="text"
                                value={ad.subtitle}
                                onChange={(e) =>
                                  updateBannerAd(ad.id, 'subtitle', e.target.value)
                                }
                                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              বাটনের লেখা
                            </label>
                            <input
                              type="text"
                              value={ad.ctaText}
                              onChange={(e) => updateBannerAd(ad.id, 'ctaText', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              ব্যানার থিম কালার
                            </label>
                            <select
                              value={ad.theme}
                              onChange={(e) =>
                                updateBannerAd(ad.id, 'theme', e.target.value as BannerTheme, true)
                              }
                              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                            >
                              <option value="obsidian">অবসিডিয়ান ডার্ক</option>
                              <option value="sapphire">রয়্যাল স্যাফায়ার</option>
                              <option value="emerald">ডিপ এমারেল্ড</option>
                              <option value="amber">ওয়ার্ম গোল্ড</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              টার্গেট ডিরেক্ট লিংক
                            </label>
                            <input
                              type="text"
                              value={ad.targetUrl}
                              onChange={(e) =>
                                updateBannerAd(ad.id, 'targetUrl', e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'links' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        অ্যান্টি-ব্লক ডিরেক্ট রিডাইরেক্ট সিস্টেম
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        সব বাটন সরাসরি নেটিভ HTML অ্যাঙ্কর (&lt;a href&gt;) হিসেবে কাজ করে, তাই ব্রাউজার পপ-আপ ব্লকার কখনোই লিংক ব্লক করতে পারে না।
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          রিডাইরেক্ট মোড
                        </label>
                        <select
                          value={config.directLinks.redirectMode}
                          onChange={(e) =>
                            updateSettingsConfig(
                              {
                                ...config,
                                directLinks: {
                                  ...config.directLinks,
                                  redirectMode: e.target.value as RedirectMode,
                                },
                              },
                              true
                            )
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        >
                          <option value="new-tab">নতুন ট্যাবে খুলুন (_blank — নেটিভ)</option>
                          <option value="same-tab">একই উইন্ডোতে সরাসরি যান (_self — ১০০% আনব্লকেবল)</option>
                        </select>
                      </div>

                      <div className="flex items-end pb-2">
                        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.directLinks.rotationEnabled}
                            onChange={(e) =>
                              updateSettingsConfig(
                                {
                                  ...config,
                                  directLinks: {
                                    ...config.directLinks,
                                    rotationEnabled: e.target.checked,
                                  },
                                },
                                true
                              )
                            }
                            className="w-4 h-4 accent-[#1877F2]"
                          />
                          <span>প্রতি ক্লিকে ডিরেক্ট লিংক অটো-রোটেট করুন</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      সংরক্ষিত ডিরেক্ট লিংক পুল
                    </h3>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLinkInput}
                        onChange={(e) => setNewLinkInput(e.target.value)}
                        placeholder="নতুন ডিরেক্ট লিংক পেস্ট করুন (https://...)"
                        className="flex-1 px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleAddDirectLink}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>লিংক যোগ</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {config.directLinks.links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-stone-400 w-5 text-right tabular-nums">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => handleUpdateDirectLink(idx, e.target.value)}
                            className="flex-1 px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg"
                          />
                          <a
                            href={sanitizeExternalUrl(link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            title="লিংক টেস্ট করুন"
                            className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                          >
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveDirectLink(idx)}
                            aria-label="লিংক মুছুন"
                            className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      ল্যান্ডিং পেজ ও হিরো সেকশন টেক্সট
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          ব্র্যান্ড নাম
                        </label>
                        <input
                          type="text"
                          value={config.brandName}
                          onChange={(e) =>
                            updateSettingsConfig({ ...config, brandName: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          হিরো শিরোনাম
                        </label>
                        <input
                          type="text"
                          value={config.heroTitle}
                          onChange={(e) =>
                            updateSettingsConfig({ ...config, heroTitle: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          হিরো বিবরণ
                        </label>
                        <textarea
                          rows={2}
                          value={config.heroSubtitle}
                          onChange={(e) =>
                            updateSettingsConfig({ ...config, heroSubtitle: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          প্রাইমারি বাটন লেখা
                        </label>
                        <input
                          type="text"
                          value={config.heroCtaText}
                          onChange={(e) =>
                            updateSettingsConfig({ ...config, heroCtaText: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-bold text-stone-900">
                        ফিচার্ড ভিডিও সেকশন
                      </h3>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.featuredMedia.enabled}
                          onChange={(e) =>
                            updateSettingsConfig(
                              {
                                ...config,
                                featuredMedia: {
                                  ...config.featuredMedia,
                                  enabled: e.target.checked,
                                },
                              },
                              true
                            )
                          }
                          className="w-4 h-4 accent-[#1877F2]"
                        />
                        <span>চালু রাখুন</span>
                      </label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          ভিডিও শিরোনাম
                        </label>
                        <input
                          type="text"
                          value={config.featuredMedia.title}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              featuredMedia: {
                                ...config.featuredMedia,
                                title: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          বাটনের লেখা
                        </label>
                        <input
                          type="text"
                          value={config.featuredMedia.ctaText}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              featuredMedia: {
                                ...config.featuredMedia,
                                ctaText: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          ভিডিও বিবরণ
                        </label>
                        <input
                          type="text"
                          value={config.featuredMedia.subtitle}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              featuredMedia: {
                                ...config.featuredMedia,
                                subtitle: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          ভিডিও URL
                        </label>
                        <input
                          type="text"
                          value={config.featuredMedia.videoUrl}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              featuredMedia: {
                                ...config.featuredMedia,
                                videoUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          “অফার দেখুন” ডিরেক্ট লিংক URL
                        </label>
                        <input
                          type="text"
                          value={config.featuredMedia.offerUrl || ''}
                          onChange={(e) =>
                            updateSettingsConfig({
                              ...config,
                              featuredMedia: {
                                ...config.featuredMedia,
                                offerUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      ব্যাকআপ ও রিসেট
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#141417] text-white rounded-xl hover:bg-stone-800 cursor-pointer"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" />
                        <span>JSON এক্সপোর্ট করুন</span>
                      </button>

                      <input
                        ref={jsonImportRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={handleImportJson}
                      />
                      <button
                        type="button"
                        onClick={() => jsonImportRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-stone-100 text-stone-900 hover:bg-stone-200 rounded-xl cursor-pointer"
                      >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        <span>JSON ইম্পোর্ট করুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          onUpdateConfig(DEFAULT_SITE_CONFIG);
                          setSelectedProfileId(DEFAULT_SITE_CONFIG.profiles[0].id);
                          await onSyncAllToDb(DEFAULT_SITE_CONFIG);
                          showFlash('ডিফল্ট সেটিংস রিস্টোর ও লাইভ সিঙ্ক হয়েছে');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        <span>ডিফল্ট রিসেট</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
