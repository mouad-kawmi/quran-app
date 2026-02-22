import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { Storage } from '../utils/storage';
import { Colors } from '../constants/Colors';
import { WifiOff, ChevronLeft } from 'lucide-react-native';
import { Translations } from '../constants/Translations';

const PortionReaderScreen = ({ juzList, onComplete, onBack, lang, theme }: any) => {
    const [ayahs, setAyahs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentJuzIndex, setCurrentJuzIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPagesInJuz, setTotalPagesInJuz] = useState(20);
    const [scrollPercent, setScrollPercent] = useState(0);
    const ayahsRef = useRef<any[]>([]);

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        loadJuz(juzList[currentJuzIndex]);
    }, [currentJuzIndex]);

    const loadJuz = async (juzNum: number) => {
        setLoading(true);
        try {
            // 1. Check Cache first
            const cached = await Storage.getJuzCache(juzNum);
            if (cached) {
                setAyahs(cached);
                ayahsRef.current = cached;
                if (cached.length > 0) {
                    const firstPage = cached[0].page;
                    const lastPage = cached[cached.length - 1].page;
                    setTotalPagesInJuz(lastPage - firstPage + 1);
                }
                setLoading(false);
                return;
            }

            // 2. Fetch from API
            const response = await axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/quran-uthmani`, { timeout: 10000 });
            if (response.data && response.data.data) {
                const fetchedAyahs = response.data.data.ayahs;
                setAyahs(fetchedAyahs);
                ayahsRef.current = fetchedAyahs;

                // Save to Cache
                await Storage.saveJuzCache(juzNum, fetchedAyahs);

                if (fetchedAyahs.length > 0) {
                    const firstPage = fetchedAyahs[0].page;
                    const lastPage = fetchedAyahs[fetchedAyahs.length - 1].page;
                    setTotalPagesInJuz(lastPage - firstPage + 1);
                    setCurrentPage(1);
                }
            }
        } catch (error) {
            console.error("Error loading Juz:", error);
            // We'll handle showing the error in the render
            setAyahs([]);
        } finally {
            setLoading(false);
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            const firstItem = viewableItems[0].item;
            const currentAyahs = ayahsRef.current;

            if (currentAyahs.length > 0) {
                const firstPageInJuz = currentAyahs[0].page;
                const lastPageInJuz = currentAyahs[currentAyahs.length - 1].page;
                const totalPages = lastPageInJuz - firstPageInJuz + 1;

                const pageProgress = firstItem.page - firstPageInJuz + 1;
                setCurrentPage(pageProgress);

                // If it's the last page, we show 100% progress
                const isLastItemVisible = viewableItems.some((v: any) => v.item.number === currentAyahs[currentAyahs.length - 1].number);
                if (isLastItemVisible) {
                    setScrollPercent(1);
                    setCurrentPage(totalPages);
                } else {
                    setScrollPercent(Math.min(pageProgress / totalPages, 1));
                }
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 10, // More sensitive to catch the first ayah of a page
        minimumViewTime: 100
    }).current;

    const handleBookmark = async (item: any) => {
        const currentBookmarks = await Storage.getBookmarks();
        const exists = currentBookmarks.find(b => b.surahNumber === item.surah.number && b.ayahNumber === item.numberInSurah);

        if (!exists) {
            const newBookmark = {
                surahNumber: item.surah.number,
                surahName: item.surah.name,
                ayahNumber: item.numberInSurah,
                text: item.text,
                date: new Date().toISOString()
            };
            const updated = [...currentBookmarks, newBookmark];
            await Storage.saveBookmarks(updated);
            Alert.alert(lang === 'ar' ? "تم الحفظ" : "Saved", lang === 'ar' ? "تم حفظ الآية بنجاح." : "Ayah bookmarked successfully.");
        } else {
            const filtered = currentBookmarks.filter(b => !(b.surahNumber === item.surah.number && b.ayahNumber === item.numberInSurah));
            await Storage.saveBookmarks(filtered);
            Alert.alert(lang === 'ar' ? "تم الإزالة" : "Removed", lang === 'ar' ? "تمت إزالة الآية من المحفوظات." : "Ayah removed from bookmarks.");
        }
    };

    const renderAyah = ({ item, index }: any) => {
        const isNewSurah = index === 0 || item.surah.number !== ayahs[index - 1].surah.number;
        return (
            <View>
                {isNewSurah && (
                    <View style={[styles.surahHeader, { borderBottomColor: activeColors.border }]}>
                        <Text style={[styles.surahTitle, { color: Colors.secondary }]}>{item.surah.name}</Text>
                    </View>
                )}
                <View style={[styles.ayahCard, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.ayahHeader}>
                        <View style={[styles.numberCircle, { borderColor: Colors.secondary, backgroundColor: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.05)' }]}>
                            <Text style={[styles.numberText, { color: Colors.secondary }]}>{item.numberInSurah}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleBookmark(item)}>
                            <Text style={{ fontSize: 18 }}>🔖</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.arabicText, { color: activeColors.text }]}>{item.text}</Text>
                </View>
            </View>
        );
    };

    const t = Translations[lang];

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    if (!loading && ayahs.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: activeColors.background }]}>
                <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <ChevronLeft size={28} color={Colors.secondary} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: activeColors.text }]}>{lang === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <WifiOff size={60} color={activeColors.textMuted} style={{ marginBottom: 20 }} />
                    <Text style={[styles.errorTitle, { color: activeColors.text }]}>
                        {lang === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}
                    </Text>
                    <Text style={[styles.errorSub, { color: activeColors.textMuted }]}>
                        {lang === 'ar'
                            ? 'هذا الجزء غير محمل مسبقاً. يرجى الاتصال بالإنترنت لتحميله مرة واحدة فقط.'
                            : 'This portion is not downloaded. Please connect to the internet to download it once.'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: Colors.secondary }]}
                        onPress={() => loadJuz(juzList[currentJuzIndex])}
                    >
                        <Text style={styles.retryBtnText}>{lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <TouchableOpacity onPress={onBack} style={{ width: 80 }}>
                    <Text style={{ color: Colors.secondary, fontWeight: 'bold' }}>{lang === 'ar' ? '✕ خروج' : '✕ Exit'}</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={[styles.title, { color: activeColors.text }]}>{lang === 'ar' ? 'الجزء' : 'Juz'} {juzList[currentJuzIndex]}</Text>
                    {!loading && ayahs.length > 0 && (
                        <View style={[styles.pageBadge, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.1)' }]}>
                            <Text style={[styles.pageInfoText, { color: Colors.secondary }]}>
                                {lang === 'ar' ? `صفحة ${currentPage} من ${totalPagesInJuz}` : `Page ${currentPage} of ${totalPagesInJuz}`}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={{ width: 80 }} />

                {/* Top Progress Bar Line */}
                <View style={styles.topProgressContainer}>
                    <View style={[styles.topProgressBar, { width: `${scrollPercent * 100}%`, backgroundColor: Colors.secondary }]} />
                </View>
            </View>
            <FlatList
                data={ayahs}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderAyah}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={{ padding: 16 }}
                ListFooterComponent={() => (
                    <View style={styles.footer}>
                        {currentJuzIndex < juzList.length - 1 ? (
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: activeColors.surface, borderColor: Colors.secondary }]}
                                onPress={() => setCurrentJuzIndex(currentJuzIndex + 1)}
                            >
                                <Text style={[styles.btnText, { color: activeColors.text }]}>{lang === 'ar' ? 'الجزء التالي ⮕' : 'Next Juz ⮕'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.secondary, borderColor: Colors.secondary }]} onPress={onComplete}>
                                <Text style={[styles.btnText, { color: Colors.dark.background }]}>✅ {lang === 'ar' ? 'أتممت ورد اليوم' : "Complete Today's Portion"}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.1)', position: 'relative' },
    title: { fontSize: 16, fontWeight: 'bold' },
    pageBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
    pageInfoText: { fontSize: 13, fontWeight: 'bold' },
    topProgressContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.05)' },
    topProgressBar: { height: '100%' },
    surahHeader: { marginVertical: 20, alignItems: 'center', borderBottomWidth: 1, paddingBottom: 10 },
    surahTitle: { fontSize: 24, fontWeight: '600' },
    ayahCard: { padding: 16, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
    numberCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    numberText: { fontSize: 12, fontWeight: 'bold' },
    arabicText: { fontSize: 24, lineHeight: 45, textAlign: 'right' },
    footer: { paddingVertical: 40, alignItems: 'center' },
    btn: { paddingVertical: 15, paddingHorizontal: 35, borderRadius: 15, borderWidth: 1 },
    btnText: { fontSize: 16, fontWeight: 'bold' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    errorSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    retryBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    retryBtnText: { color: Colors.dark.background, fontWeight: 'bold', fontSize: 16 },
    backButton: { padding: 8 }
});

export default PortionReaderScreen;
