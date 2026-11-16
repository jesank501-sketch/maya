export type Gender = 'female' | 'male';
export type GenderFilter = 'all' | Gender;
export type RedirectMode = 'new-tab' | 'same-tab';
export type BannerTheme = 'sapphire' | 'emerald' | 'obsidian' | 'amber';

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  profession: string;
  education: string;
  height: string;
  mutualFriends: number;
  shortBio: string;
  fullBio: string;
  interests: string[];
  imageUrl: string;
  verified: boolean;
  relationshipStatus: string;
  availabilityLabel: string;
  messageLabel: string;
  messageLinkOverride: string;
}

export interface BannerAd {
  id: string;
  placement: 'top' | 'mid-feed';
  enabled: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
  targetUrl: string;
  theme: BannerTheme;
}

export interface PopupAdConfig {
  enabled: boolean;
  title: string;
  offerHighlight: string;
  subtitle: string;
  ctaText: string;
  targetUrl: string;
  delaySeconds: number;
}

export interface DirectLinkConfig {
  links: string[];
  rotationEnabled: boolean;
  redirectMode: RedirectMode;
  activeIndex: number;
}

export interface FeaturedMediaConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  videoUrl: string;
  ctaText: string;
  targetUrl: string;
  offerUrl: string;
}

export interface SiteConfig {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImage: string;
  profiles: Profile[];
  bannerAds: BannerAd[];
  popupAd: PopupAdConfig;
  directLinks: DirectLinkConfig;
  featuredMedia: FeaturedMediaConfig;
}
