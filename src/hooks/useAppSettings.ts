import { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';

/**
 * Hook to manage app-wide settings like language, theme, and reciter.
 */
export const useAppSettings = () => {
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [reciter, setReciter] = useState('Alafasy_128kbps');

    useEffect(() => {
        const loadSettings = async () => {
            const savedLang = await Storage.getLang();
            if (savedLang) setLang(savedLang as 'ar' | 'en');

            const savedTheme = await Storage.getTheme();
            if (savedTheme) setTheme(savedTheme as 'dark' | 'light');

            const savedReciter = await Storage.getReciter();
            if (savedReciter) setReciter(savedReciter);
        };
        loadSettings();
    }, []);

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'ar' : 'en';
        setLang(newLang);
        Storage.saveLang(newLang);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        Storage.saveTheme(newTheme);
    };

    return {
        lang,
        theme,
        reciter,
        setReciter,
        toggleLanguage,
        toggleTheme
    };
};
