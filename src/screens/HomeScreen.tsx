import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors } from '../constants/Colors';
import { fetchSurahs, Surah } from '../api/quranApi';
import SurahCard from '../components/SurahCard';
import { Translations } from '../constants/Translations';
import { Storage } from '../utils/storage';
import { getHijriDate } from '../utils/dateUtils';
import { RemoteContentService, RemoteVerse } from '../api/remoteContent';
import { useQuranSync } from '../hooks/useQuranSync';

// Sub-components
import HomeHeader from '../components/home/HomeHeader';
import DailyVerseCard from '../components/home/DailyVerseCard';
import LastReadCard from '../components/home/LastReadCard';
import SyncStatusBanner from '../components/home/SyncStatusBanner';

interface Props {
    onSelectSurah: (num: number, name: string, arName: string, start?: number) => void;
    lang: string;
    theme: 'dark' | 'light';
    refreshTrigger?: number;
}

const HomeScreen = ({ onSelectSurah, lang, theme, refreshTrigger }: Props) => {
    const t = Translations[lang];
    const activeColors = theme === 'dark' ? Colors.dark : Colors.light;
    const { isSyncing, syncProgress, checkAndSyncQuran } = useQuranSync();

    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRead, setLastRead] = useState<any>(null);
    const [dailyVerse, setDailyVerse] = useState<RemoteVerse | null>(null);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            const [surahData, lastReadData, verseData] = await Promise.all([
                fetchSurahs(), Storage.getLastRead(), RemoteContentService.getDailyVerse()
            ]);
            if (surahData) {
                setSurahs(surahData);
                setFilteredSurahs(surahData);
                checkAndSyncQuran(surahData);
            }
            setLastRead(lastReadData);
            setDailyVerse(verseData);
            setLoading(false);
        };
        loadAll();
    }, [refreshTrigger]);

    const handleSearch = (text: string) => {
        const q = text.trim().toLowerCase();
        setSearchQuery(q);
        if (!q) return setFilteredSurahs(surahs);

        const clean = (val: string) => val.replace(/[ًٌٍَُِّْٰ]/g, '');
        setFilteredSurahs(surahs.filter(s =>
            s.englishName.toLowerCase().includes(q) || clean(s.name).includes(clean(q)) || s.number.toString() === q
        ));
    };

    if (loading || !dailyVerse) {
        return (
            <View style={[styles.loading, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    const hour = new Date().getHours();
    const greeting = lang === 'ar'
        ? (hour < 12 ? 'صباح الخير' : (hour < 18 ? 'طاب يومك' : 'مساء الخير'))
        : (hour < 12 ? 'Good Morning' : (hour < 17 ? 'Good Afternoon' : 'Good Evening'));

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <HomeHeader greeting={greeting} hijriDate={getHijriDate(lang)} title={t.quran}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} placeholder={t.searchSurah} activeColors={activeColors} />

            <SyncStatusBanner isSyncing={isSyncing} syncProgress={syncProgress} lang={lang} activeColors={activeColors} />

            <FlatList data={filteredSurahs} keyExtractor={(s) => s.number.toString()} contentContainerStyle={styles.listContent}
                ListHeaderComponent={() => !searchQuery ? (
                    <>
                        <DailyVerseCard dailyVerse={dailyVerse} lang={lang} activeColors={activeColors} />
                        <LastReadCard lastRead={lastRead} lang={lang} isDark={theme === 'dark'} activeColors={activeColors} translations={t}
                            onPress={() => onSelectSurah(lastRead.number, lastRead.name, lastRead.arabicName || lastRead.name, lastRead.ayahNumber)} />
                    </>
                ) : null}
                renderItem={({ item }) => (
                    <SurahCard surah={item} onPress={() => onSelectSurah(item.number, item.englishName, item.name)} lang={lang} theme={theme} />
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 20, paddingHorizontal: 20 },
});

export default HomeScreen;
