import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@quran_bookmarks';

export interface Bookmark {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    text: string;
}

export const getBookmarks = async (): Promise<Bookmark[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(BOOKMARKS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        return [];
    }
};

export const saveBookmark = async (bookmark: Bookmark) => {
    try {
        const bookmarks = await getBookmarks();
        // Check if already bookmarked
        const exists = bookmarks.find(b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber);
        if (!exists) {
            const newBookmarks = [...bookmarks, bookmark];
            await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
        }
    } catch (e) {
        console.error('Error saving bookmark', e);
    }
};

export const removeBookmark = async (surahNumber: number, ayahNumber: number) => {
    try {
        const bookmarks = await getBookmarks();
        const newBookmarks = bookmarks.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    } catch (e) {
        console.error('Error removing bookmark', e);
    }
};
