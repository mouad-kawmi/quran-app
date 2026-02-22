import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { fetchSurahs, fetchSurahDetail, Surah } from '../api/quranApi';
import SurahCard from '../components/SurahCard';
import { Translations } from '../constants/Translations';
import { Storage } from '../utils/storage';
import { DAILY_VERSES } from '../constants/DailyVerses';
import { LucideIcon, BookOpen, Clock, Heart, Search, ChevronRight } from 'lucide-react-native';
import { getHijriDate } from '../utils/dateUtils';

interface Props {
    onSelectSurah: (number: number, name: string, arabicName: string, startAyah?: number) => void;
    lang: string;
    theme: 'dark' | 'light';
    refreshTrigger?: number;
}

const HomeScreen = ({ onSelectSurah, lang, theme, refreshTrigger }: Props) => {
    const t = Translations[lang];
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRead, setLastRead] = useState<any>(null);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    const hijriDate = getHijriDate(lang);
    const hour = new Date().getHours();
    let greeting = "";
    if (lang === 'ar') {
        if (hour >= 5 && hour < 12) greeting = 'صباح الخير';
        else if (hour >= 12 && hour < 18) greeting = 'طاب يومك';
        else greeting = 'مساء الخير';
    } else {
        if (hour >= 5 && hour < 12) greeting = 'Good Morning';
        else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else greeting = 'Good Evening';
    }

    useEffect(() => {
        loadSurahs();
        loadLastRead();
    }, [refreshTrigger]);

    const loadSurahs = async () => {
        try {
            setLoading(true);
            let data = await fetchSurahs();

            // Fail-safe: if data is empty or null, use data from constants directly
            if (!data || data.length === 0) {
                const { SURAH_LIST_DATA } = require('../constants/SurahData');
                data = SURAH_LIST_DATA;
            }

            setSurahs(data);
            setFilteredSurahs(data);
            checkAndSyncQuran(data);
        } catch (e) {
            console.error("Critical error loading surahs:", e);
        } finally {
            setLoading(false);
        }
    };

    const loadLastRead = async () => {
        const data = await Storage.getLastRead();
        if (data) setLastRead(data);
    };

    const checkAndSyncQuran = async (surahList: Surah[]) => {
        const isSynced = await Storage.isFullSynced();
        if (isSynced) {
            setSyncProgress(100);
            return;
        }

        setIsSyncing(true);
        let count = 0;

        // Helper to add delay
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (const surah of surahList) {
            try {
                const cached = await Storage.getSurahCache(surah.number);
                if (!cached) {
                    const fullDetails = await fetchSurahDetail(surah.number);
                    // Critical Fix: Keep essential fields for SurahDetailScreen to prevent crashes
                    // Extra Compression: Shorten keys to save space (SQLITE_FULL fix)
                    const minimizedDetails = fullDetails.map((edition: any) => ({
                        e: { id: edition.edition.identifier },
                        a: edition.ayahs.map((a: any) => ({
                            n: a.number,
                            ns: a.numberInSurah,
                            t: a.text
                        }))
                    }));
                    await Storage.saveSurahCache(surah.number, minimizedDetails);
                    await delay(300);
                }
                count++;
                setSyncProgress(Math.floor((count / surahList.length) * 100));
            } catch (e) {
                console.log(`Sync skipped for Surah ${surah.number} (will retry next time)`, e);
                // Don't stop the whole process, just skip this one for now
                count++;
                continue;
            }
        }

        // Only set full sync if we actually finished everything (optional)
        if (count === surahList.length) {
            await Storage.setFullSync(true);
        }
        setIsSyncing(false);
    };

    const normalizeArabic = (text: string) => {
        return text.replace(/[ًٌٍَُِّْٰ]/g, '');
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredSurahs(surahs);
        } else {
            const normalizedQuery = normalizeArabic(text);
            const filtered = surahs.filter(
                (s) =>
                    s.englishName.toLowerCase().includes(text.toLowerCase()) ||
                    normalizeArabic(s.name).includes(normalizedQuery) ||
                    s.number.toString() === text
            );
            setFilteredSurahs(filtered);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const dailyVerse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={[styles.greeting, { color: activeColors.textMuted }]}>{greeting}</Text>
                    <Text style={[styles.hijriDate, { color: Colors.secondary }]}>{hijriDate}</Text>
                </View>
                <Text style={[styles.title, { color: activeColors.text }]}>{t.quran}</Text>
                <View style={[styles.searchContainer, { backgroundColor: activeColors.surface }]}>
                    <Search size={20} color={activeColors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: activeColors.text }]}
                        placeholder={t.searchSurah}
                        placeholderTextColor={activeColors.textMuted}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {isSyncing && (
                <View style={[styles.syncContainer, { backgroundColor: activeColors.surface, borderLeftWidth: 4, borderLeftColor: Colors.secondary }]}>
                    <View style={styles.syncHeader}>
                        <Text style={[styles.syncText, { color: activeColors.text }]}>
                            {lang === 'ar' ? 'جاري تحميل القرآن...' : 'Downloading Quran...'}
                        </Text>
                        <Text style={[styles.syncPercent, { color: Colors.secondary }]}>{syncProgress}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: activeColors.surfaceLight }]}>
                        <View style={[styles.progressBarFill, { width: `${syncProgress}%`, backgroundColor: Colors.secondary }]} />
                    </View>
                </View>
            )}

            <FlatList
                data={filteredSurahs}
                keyExtractor={(item) => item.number.toString()}
                ListHeaderComponent={() => (
                    <>
                        {!searchQuery && (
                            <>
                                <View style={[styles.dailyVerseCard, { backgroundColor: Colors.secondary + '15' }]}>
                                    <View style={styles.dailyVerseHeader}>
                                        <Heart size={16} color={Colors.secondary} fill={Colors.secondary} />
                                        <Text style={[styles.dailyVerseTitle, { color: Colors.secondary }]}>
                                            {lang === 'ar' ? 'آية اليوم' : 'Verse of the Day'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.dailyVerseText, { color: activeColors.text }]}>{dailyVerse.verse}</Text>
                                    <Text style={[styles.dailyVerseTranslation, { color: activeColors.textMuted }]}>
                                        {dailyVerse.translation}
                                    </Text>
                                    <Text style={[styles.dailyVerseRef, { color: Colors.secondary }]}>
                                        {dailyVerse.surah} : {dailyVerse.ayah}
                                    </Text>
                                </View>

                                {lastRead && (
                                    <TouchableOpacity
                                        style={[styles.lastReadCard, {
                                            backgroundColor: isDark ? activeColors.surface : '#FFFBF5',
                                            borderWidth: 1.5,
                                            borderColor: Colors.secondary,
                                            shadowColor: Colors.secondary,
                                            shadowOpacity: 0.1
                                        }]}
                                        onPress={() => onSelectSurah(lastRead.number, lastRead.name, lastRead.arabicName || lastRead.name, lastRead.ayahNumber)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.lastReadHeader}>
                                                <Clock size={18} color={Colors.secondary} />
                                                <Text style={[styles.lastReadLabel, { color: Colors.secondary, marginLeft: 8 }]}>{t.lastRead}</Text>
                                            </View>
                                            <Text style={[styles.lastReadTitle, { color: activeColors.text }]}>
                                                {lang === 'ar' ? (lastRead.arabicName || lastRead.name) : lastRead.name}
                                            </Text>
                                            <Text style={[styles.lastReadLabel, { color: activeColors.textMuted, opacity: 0.8 }]}>
                                                {lang === 'ar' ? `الآية ${lastRead.ayahNumber}` : `Ayah ${lastRead.ayahNumber}`}
                                            </Text>
                                        </View>
                                        <View style={[styles.lastReadArrow, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
                                            <ChevronRight size={24} color={Colors.secondary} />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </>
                )}
                renderItem={({ item }) => (
                    <SurahCard
                        surah={item}
                        onPress={() => onSelectSurah(item.number, item.englishName, item.name)}
                        lang={lang}
                        theme={theme}
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: activeColors.text }]}>
                            {lang === 'ar' ? 'لم يتم العثور على سور' : 'No surahs found'}
                        </Text>
                        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Colors.secondary }]} onPress={loadSurahs}>
                            <Text style={{ fontWeight: 'bold', color: Colors.dark.background }}>
                                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10
    },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    searchInput: { flex: 1, fontSize: 16, marginLeft: 10 },
    listContent: { paddingBottom: 20, paddingHorizontal: 20 },
    dailyVerseCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        marginTop: 5,
    },
    dailyVerseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dailyVerseTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
    dailyVerseText: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', lineHeight: 32, marginBottom: 10 },
    dailyVerseTranslation: { fontSize: 14, lineHeight: 22, marginBottom: 10 },
    dailyVerseRef: { fontSize: 12, fontWeight: 'bold', textAlign: 'right' },
    lastReadCard: {
        flexDirection: 'row',
        padding: 25,
        borderRadius: 25,
        marginBottom: 25,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 5,
    },
    lastReadHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    lastReadIcon: { fontSize: 18, marginRight: 8 },
    lastReadLabel: { fontSize: 12, fontWeight: '600', opacity: 0.8 },
    lastReadTitle: { fontSize: 22, fontWeight: 'bold' },
    lastReadArrow: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    syncContainer: { padding: 15, marginHorizontal: 20, borderRadius: 15, marginBottom: 20 },
    syncHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    syncText: { fontSize: 13, fontWeight: '500', flex: 1 },
    syncPercent: { fontSize: 13, fontWeight: 'bold', marginLeft: 10 },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    greeting: { fontSize: 13, fontWeight: '500' },
    hijriDate: { fontSize: 13, fontWeight: 'bold' },
    emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});

export default HomeScreen;
