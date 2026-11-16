import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Profile, SiteConfig } from '../types';

const PROFILES_COLLECTION = 'profiles';
const SETTINGS_COLLECTION = 'siteSettings';
const MAIN_SETTINGS_ID = 'main';

function sanitizeProfilePayload(profile: Profile, sortOrder: number) {
  return {
    name: String(profile.name || 'প্রোফাইল').slice(0, 100),
    age: Math.min(99, Math.max(18, Number(profile.age) || 22)),
    gender: profile.gender === 'male' ? 'male' : 'female',
    city: String(profile.city || '').slice(0, 100),
    profession: String(profile.profession || '').slice(0, 120),
    education: String(profile.education || '').slice(0, 160),
    height: String(profile.height || '').slice(0, 60),
    mutualFriends: Math.min(100000, Math.max(0, Number(profile.mutualFriends) || 0)),
    shortBio: String(profile.shortBio || '').slice(0, 400),
    fullBio: String(profile.fullBio || '').slice(0, 1500),
    interests: (profile.interests || []).slice(0, 15).map((item) => String(item).slice(0, 60)),
    imageUrl: String(profile.imageUrl || '').slice(0, 200000),
    verified: Boolean(profile.verified),
    relationshipStatus: String(profile.relationshipStatus || 'সিঙ্গেল').slice(0, 60),
    availabilityLabel: String(profile.availabilityLabel || '').slice(0, 80),
    messageLabel: String(profile.messageLabel || 'Message Me').slice(0, 60),
    messageLinkOverride: String(profile.messageLinkOverride || '').slice(0, 500),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

function sanitizeSiteSettingsPayload(config: SiteConfig, uid: string) {
  return {
    brandName: String(config.brandName || 'পরিচয়').slice(0, 80),
    heroTitle: String(config.heroTitle || 'আগে কথা বলুন, ভালো লাগলে আরও কথা বলবো').slice(0, 240),
    heroSubtitle: String(config.heroSubtitle || '').slice(0, 500),
    heroCtaText: String(config.heroCtaText || 'সরাসরি কথা বলুন').slice(0, 80),
    heroImage: String(config.heroImage || '').slice(0, 200000),
    bannerAds: (config.bannerAds || []).slice(0, 20),
    popupAd: config.popupAd,
    directLinks: {
      ...config.directLinks,
      links: (config.directLinks?.links || []).slice(0, 30).map((u) => String(u).slice(0, 500)),
    },
    featuredMedia: config.featuredMedia,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };
}

export function subscribeToPublicSiteData(
  onProfiles: (profiles: Profile[] | null) => void,
  onSettings: (settings: Partial<SiteConfig> | null) => void
): () => void {
  const profilesQuery = query(
    collection(db, PROFILES_COLLECTION),
    orderBy('sortOrder', 'asc')
  );

  const unsubProfiles = onSnapshot(
    profilesQuery,
    (snapshot) => {
      if (snapshot.empty) {
        onProfiles(null);
        return;
      }
      const items: Profile[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name || ''),
          age: Number(data.age || 22),
          gender: data.gender === 'male' ? 'male' : 'female',
          city: String(data.city || ''),
          profession: String(data.profession || ''),
          education: String(data.education || ''),
          height: String(data.height || ''),
          mutualFriends: Number(data.mutualFriends || 0),
          shortBio: String(data.shortBio || ''),
          fullBio: String(data.fullBio || ''),
          interests: Array.isArray(data.interests) ? data.interests.map(String) : [],
          imageUrl: String(data.imageUrl || ''),
          verified: Boolean(data.verified),
          relationshipStatus: String(data.relationshipStatus || 'সিঙ্গেল'),
          availabilityLabel: String(data.availabilityLabel || ''),
          messageLabel: String(data.messageLabel || 'Message Me'),
          messageLinkOverride: String(data.messageLinkOverride || ''),
        };
      });
      onProfiles(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PROFILES_COLLECTION);
    }
  );

  const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_ID);
  const unsubSettings = onSnapshot(
    settingsRef,
    (snap) => {
      if (!snap.exists()) {
        onSettings(null);
        return;
      }
      const data = snap.data();
      onSettings({
        brandName: data.brandName,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroCtaText: data.heroCtaText,
        heroImage: data.heroImage,
        bannerAds: data.bannerAds,
        popupAd: data.popupAd,
        directLinks: data.directLinks,
        featuredMedia: data.featuredMedia,
      });
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${SETTINGS_COLLECTION}/${MAIN_SETTINGS_ID}`
      );
    }
  );

  return () => {
    unsubProfiles();
    unsubSettings();
  };
}

export async function ensureFirestoreSeeded(config: SiteConfig, uid: string): Promise<void> {
  const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_ID);
  try {
    const settingsSnap = await getDoc(settingsRef);
    const profilesSnap = await getDocs(collection(db, PROFILES_COLLECTION));

    if (settingsSnap.exists() && !profilesSnap.empty) {
      return;
    }

    const batch = writeBatch(db);
    if (!settingsSnap.exists()) {
      batch.set(settingsRef, sanitizeSiteSettingsPayload(config, uid));
    }
    if (profilesSnap.empty) {
      config.profiles.forEach((prof, index) => {
        const cleanId = prof.id.replace(/[^a-zA-Z0-9_-]/g, '') || `prof-${Date.now()}-${index}`;
        const profRef = doc(db, PROFILES_COLLECTION, cleanId);
        batch.set(profRef, {
          ...sanitizeProfilePayload(prof, index),
          createdBy: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${MAIN_SETTINGS_ID}`);
  }
}

export async function saveProfileToFirestore(
  profile: Profile,
  sortOrder: number,
  uid: string
): Promise<void> {
  const cleanId = profile.id.replace(/[^a-zA-Z0-9_-]/g, '') || `prof-${Date.now()}`;
  const path = `${PROFILES_COLLECTION}/${cleanId}`;
  const profRef = doc(db, PROFILES_COLLECTION, cleanId);
  const payload = sanitizeProfilePayload(profile, sortOrder);

  try {
    const existingSnap = await getDoc(profRef);
    if (existingSnap.exists()) {
      await updateDoc(profRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(profRef, {
        ...payload,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProfileFromFirestore(profileId: string): Promise<void> {
  const cleanId = profileId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) return;
  const path = `${PROFILES_COLLECTION}/${cleanId}`;
  try {
    await deleteDoc(doc(db, PROFILES_COLLECTION, cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSiteSettingsToFirestore(
  config: SiteConfig,
  uid: string
): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${MAIN_SETTINGS_ID}`;
  const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_ID);
  const payload = sanitizeSiteSettingsPayload(config, uid);
  try {
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      await updateDoc(settingsRef, payload);
    } else {
      await setDoc(settingsRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const maxWidth = 640;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
