import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { saveBookmark } from '../api/bookmarksStore';
import { Colors } from '../constants/Colors';

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
            const response = await axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/quran-uthmani`);
            if (response.data && response.data.data) {
                const fetchedAyahs = response.data.data.ayahs;
                setAyahs(fetchedAyahs);
                ayahsRef.current = fetchedAyahs;

                // Calculate total pages in this juz
                if (fetchedAyahs.length > 0) {
                    const firstPage = fetchedAyahs[0].page;
                    const lastPage = fetchedAyahs[fetchedAyahs.length - 1].page;
                    setTotalPagesInJuz(lastPage - firstPage + 1);
                    setCurrentPage(1);
                }
            }
        } catch (error) {
            console.error(error);
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
        await saveBookmark({
            surahNumber: item.surah.number,
            surahName: item.surah.englishName,
            ayahNumber: item.numberInSurah,
            text: item.text
        });
        Alert.alert(lang === 'ar' ? "تم الحفظ" : "Saved", lang === 'ar' ? "تم حفظ الآية بنجاح." : "Ayah bookmarked successfully.");
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

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
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
    btnText: { fontSize: 16, fontWeight: 'bold' }
});

export default PortionReaderScreen;
