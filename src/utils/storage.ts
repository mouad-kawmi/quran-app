import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    LANG: '@quran_premium_lang',
    THEME: '@quran_premium_theme',
    BOOKMARKS: '@quran_premium_bookmarks',
    KHATMA_STATE: '@quran_premium_khatma_state',
    LAST_READ: '@quran_premium_last_read',
    TASBIH: '@quran_premium_tasbih',
    SURAH_CACHE_PREFIX: '@quran_premium_surah_cache_',
    SURAH_LIST: '@quran_premium_surah_list',
    PRAYER_TIMES: '@prayerTimes',
    FULL_SYNC: '@fullSync',
    JUZ_CACHE_PREFIX: '@quran_premium_juz_cache_',
    PUSH_TOKEN: '@quran_premium_push_token',
    RECITER: '@reciter'
};

export const Storage = {
    async savePushToken(token: string) {
        await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
    },
    async getPushToken() {
        return await AsyncStorage.getItem(KEYS.PUSH_TOKEN);
    },
    async saveLang(lang: string) {
        await AsyncStorage.setItem(KEYS.LANG, lang);
    },
    async getLang() {
        return await AsyncStorage.getItem(KEYS.LANG);
    },

    async saveTheme(theme: string) {
        await AsyncStorage.setItem(KEYS.THEME, theme);
    },
    async getTheme() {
        return await AsyncStorage.getItem(KEYS.THEME);
    },

    async saveBookmarks(bookmarks: any[]) {
        await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    },
    async getBookmarks(): Promise<any[]> {
        const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
        return data ? JSON.parse(data) : [];
    },

    async saveKhatma(state: any) {
        await AsyncStorage.setItem(KEYS.KHATMA_STATE, JSON.stringify(state));
    },
    async getKhatma() {
        const data = await AsyncStorage.getItem(KEYS.KHATMA_STATE);
        return data ? JSON.parse(data) : null;
    },

    async saveLastRead(data: { number: number, name: string, arabicName?: string, ayahNumber?: number }) {
        await AsyncStorage.setItem(KEYS.LAST_READ, JSON.stringify(data));
    },
    async getLastRead() {
        const data = await AsyncStorage.getItem(KEYS.LAST_READ);
        return data ? JSON.parse(data) : null;
    },

    async saveTasbih(count: number) {
        await AsyncStorage.setItem(KEYS.TASBIH, count.toString());
    },
    async getTasbih(): Promise<number | null> {
        const data = await AsyncStorage.getItem(KEYS.TASBIH);
        return data ? parseInt(data, 10) : null;
    },

    // Surah Cache — نحفظو السورة باش ما ترجعش تحمل من الإنترنت
    async saveSurahCache(surahNumber: number, data: any) {
        const key = KEYS.SURAH_CACHE_PREFIX + surahNumber;
        await AsyncStorage.setItem(key, JSON.stringify(data));
    },
    async getSurahCache(surahNumber: number): Promise<any | null> {
        const key = KEYS.SURAH_CACHE_PREFIX + surahNumber;
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Juz Cache - For Khatma offline support
    async saveJuzCache(juzNumber: number, data: any) {
        const key = KEYS.JUZ_CACHE_PREFIX + juzNumber;
        await AsyncStorage.setItem(key, JSON.stringify(data));
    },
    async getJuzCache(juzNumber: number): Promise<any | null> {
        const key = KEYS.JUZ_CACHE_PREFIX + juzNumber;
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    async saveSurahList(surahs: any[]) {
        await AsyncStorage.setItem(KEYS.SURAH_LIST, JSON.stringify(surahs));
    },
    async getSurahList(): Promise<any[] | null> {
        const data = await AsyncStorage.getItem(KEYS.SURAH_LIST);
        return data ? JSON.parse(data) : null;
    },

    async savePrayerTimes(times: any, city?: string) {
        const data = { times, city, date: new Date().toDateString() };
        await AsyncStorage.setItem(KEYS.PRAYER_TIMES, JSON.stringify(data));
    },
    async getPrayerTimes(): Promise<any | null> {
        const data = await AsyncStorage.getItem(KEYS.PRAYER_TIMES);
        return data ? JSON.parse(data) : null;
    },

    async setFullSync(status: boolean) {
        await AsyncStorage.setItem(KEYS.FULL_SYNC, status ? 'true' : 'false');
    },
    async isFullSynced(): Promise<boolean> {
        const data = await AsyncStorage.getItem(KEYS.FULL_SYNC);
        return data === 'true';
    },

    async saveReciter(reciterId: string) {
        await AsyncStorage.setItem(KEYS.RECITER, reciterId);
    },
    async getReciter(): Promise<string> {
        const data = await AsyncStorage.getItem(KEYS.RECITER);
        return data ? data : 'Alafasy_128kbps'; // Default
    },

    async clearAllCache() {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key => 
            key.startsWith(KEYS.SURAH_CACHE_PREFIX) || 
            key.startsWith(KEYS.JUZ_CACHE_PREFIX)
        );
        await AsyncStorage.multiRemove(cacheKeys);
        await AsyncStorage.removeItem(KEYS.FULL_SYNC);
    },

    async resetEverything() {
        await AsyncStorage.clear();
    },
};
