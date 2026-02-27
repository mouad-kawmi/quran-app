import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore/lite';
import { db } from './firebaseConfig';
import { DAILY_VERSES } from '../constants/DailyVerses';

export interface RemoteVerse {
    verse: string;
    translation: string;
    surah: string;
    ayah: number;
}

export const RemoteContentService = {
    /**
     * Fetches the "Verse of the Day" from Firestore.
     * If Firestore fails or is empty, falls back to the local DAILY_VERSES.
     */
    async getDailyVerse(): Promise<RemoteVerse> {
        try {
            // We check for a "daily_verses" collection, sorted by date or just picking the latest
            const q = query(collection(db, 'daily_verses'), orderBy('date', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                return {
                    verse: docData.verse,
                    translation: docData.translation,
                    surah: docData.surah,
                    ayah: docData.ayah
                };
            }
        } catch (e) {
            console.log('[RemoteContent] Error fetching from Firebase, using local fallback:', e);
        }

        // Fallback logic (same as in HomeScreen)
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
    },

    /**
     * Fetch Hadiths from Firestore. Falls back to an empty array or local data if needed.
     */
    async getHadiths(): Promise<any[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'hadiths'));
            if (!querySnapshot.empty) {
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (e) { console.log('[RemoteContent] Hadiths fetch error:', e); }
        return [];
    },

    /**
     * Fetch Adhkar Categories from Firestore.
     */
    async getAdhkar(): Promise<any[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'adhkar'));
            if (!querySnapshot.empty) {
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (e) { console.log('[RemoteContent] Adhkar fetch error:', e); }
        return [];
    },

    /**
     * Fetch a generic collection from Firestore (e.g., Duas, Adhkar)
     */
    async getCollection(name: string): Promise<any[]> {
        try {
            const querySnapshot = await getDocs(collection(db, name));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.log(`[RemoteContent] Error fetching collection ${name}:`, e);
            return [];
        }
    }
};
