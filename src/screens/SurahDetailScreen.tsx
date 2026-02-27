import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    Dimensions,
    Platform,
    StatusBar,
    ImageBackground,
    Share,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSurahDetail } from '../api/quranApi';
import { Storage } from '../utils/storage';
import { Colors } from '../constants/Colors';
import { Translations } from '../constants/Translations';
import { Audio } from 'expo-av';
import {
    ChevronLeft,
    Play,
    Pause,
    Bookmark,
    BookOpen,
    Languages,
    Copy,
    X,
    WifiOff,
    CheckCircle,
    Share2,
    Eye,
    Download
} from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const SurahDetailScreen = ({ route, onBack, lang, theme, reciter }: any) => {
    const { number, name, arabicName, startAyah } = route.params;
    const [pageList, setPageList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [selectedAyah, setSelectedAyah] = useState<any>(null);
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [contentModalVisible, setContentModalVisible] = useState(false);
    const [modalContentType, setModalContentType] = useState<'translation' | 'tafsir'>('translation');
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [allEditionsData, setAllEditionsData] = useState<any[]>([]);
    const [visibleMetadata, setVisibleMetadata] = useState<any>({ page: 0, juz: 0, surahName: arabicName });

    const flatListRef = useRef<any>(null);
    const soundRef = useRef<any>(null);
    const isInitialScrollDone = useRef(false);
    const viewShotRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;
    const t = Translations[lang];

    useEffect(() => {
        loadDetail();
        loadBookmarks();

        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            interruptionModeIOS: 1,
            interruptionModeAndroid: 1,
        }).catch(e => console.log('Audio mode error', e));

        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, [number]);

    const loadBookmarks = async () => {
        const b = await Storage.getBookmarks();
        setBookmarks(b);
    };

    const loadDetail = async () => {
        setLoading(true);
        try {
            // 1. Check Cache
            let data = await Storage.getSurahCache(number);

            if (data) {
                // FALLBACK: If cached data is missing page info (p), refetch it once
                const hasPageInfo = data[0]?.a[0]?.p;
                if (!hasPageInfo) {
                    data = null;
                }
            }

            if (!data) {
                // 2. Fetch all 3 editions (Uthmani, Tafsir Muyassar, Pickthall Translation)
                data = await fetchSurahDetail(number);
                // Minimize for storage
                const minimized = data.map((edition: any) => ({
                    e: { id: edition.edition.identifier },
                    a: edition.ayahs.map((a: any) => ({
                        n: a.number,
                        ns: a.numberInSurah,
                        t: a.text,
                        p: a.page,
                        j: a.juz,
                        h: a.hizbQuarter
                    }))
                }));
                Storage.saveSurahCache(number, minimized);
                data = minimized;
            }

            setAllEditionsData(data);
            const uthmaniAyahs = data[0].a;

            // Set initial metadata immediately
            const firstAyah = uthmaniAyahs[0];
            if (firstAyah) {
                setVisibleMetadata({
                    page: firstAyah.p || firstAyah.page || 0,
                    juz: firstAyah.j || firstAyah.juz || 0,
                    surahName: lang === 'ar' ? arabicName : name
                });
            }

            const processedPages = processToPages(uthmaniAyahs);
            setPageList(processedPages);

            // 3. Initial Scroll logic
            if (startAyah && startAyah > 1) {
                // Find which page contains startAyah
                const targetPageIndex = processedPages.findIndex(p => p.ayahs.some((a: any) => a.ns === startAyah));
                if (targetPageIndex !== -1) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: targetPageIndex, animated: false });
                        setTimeout(() => {
                            isInitialScrollDone.current = true;
                        }, 500);
                    }, 800);
                } else {
                    isInitialScrollDone.current = true;
                }
            } else {
                isInitialScrollDone.current = true;
            }
        } catch (error) {
            console.error("[Mushaf] Error loading surah:", error);
        } finally {
            setLoading(false);
        }
    };

    const processToPages = (ayahs: any[]) => {
        const pages: any = {};
        ayahs.forEach((a: any) => {
            const p = a.p;
            if (!p) return;
            if (!pages[p]) pages[p] = [];
            pages[p].push(a);
        });

        return Object.keys(pages).sort((a, b) => parseInt(a) - parseInt(b)).map(p => ({
            page: p,
            ayahs: pages[p]
        }));
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (isInitialScrollDone.current && viewableItems && viewableItems.length > 0) {
            const firstPage = viewableItems[0].item;
            const firstAyah = firstPage.ayahs[0];
            if (firstAyah) {
                setVisibleMetadata({
                    page: firstPage.page,
                    juz: firstAyah.j || firstAyah.juz,
                    surahName: lang === 'ar' ? arabicName : name
                });

                // Save Last Read
                Storage.saveLastRead({
                    number,
                    name,
                    arabicName,
                    ayahNumber: firstAyah.ns
                });
            }
        }
    }).current;

    const handlePlayAudio = async (ayah: any) => {
        try {
            if (soundRef.current) await soundRef.current.unloadAsync();
            if (playingAyah === ayah.n) {
                setPlayingAyah(null);
                return;
            }

            setPlayingAyah(ayah.n);
            const surahPadded = number.toString().padStart(3, '0');
            const ayahPadded = ayah.ns.toString().padStart(3, '0');
            const audioUrl = `https://everyayah.com/data/${reciter || 'Alafasy_128kbps'}/${surahPadded}${ayahPadded}.mp3`;

            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                (status: any) => {
                    if (status.isLoaded && status.didJustFinish) setPlayingAyah(null);
                }
            );
            soundRef.current = sound;
            setOptionsModalVisible(false);
        } catch (e) {
            setPlayingAyah(null);
            Alert.alert(t.offlineTitle, t.offlineMessage);
        }
    };

    const handleToggleBookmark = async () => {
        if (!selectedAyah) return;
        const currentBookmarks = await Storage.getBookmarks();
        const exists = currentBookmarks.some(b => b.surahNumber === number && b.ayahNumber === selectedAyah.ns);

        if (exists) {
            const filtered = currentBookmarks.filter(b => !(b.surahNumber === number && b.ayahNumber === selectedAyah.ns));
            await Storage.saveBookmarks(filtered);
            setBookmarks(filtered);
        } else {
            const newBookmark = {
                surahNumber: number,
                surahName: name,
                ayahNumber: selectedAyah.ns,
                text: selectedAyah.t,
                date: new Date().toISOString()
            };
            const updated = [...currentBookmarks, newBookmark];
            await Storage.saveBookmarks(updated);
            setBookmarks(updated);
        }
        setOptionsModalVisible(false);
    };

    const handleShowContent = (type: 'translation' | 'tafsir') => {
        setModalContentType(type);
        setOptionsModalVisible(false);
        setTimeout(() => setContentModalVisible(true), 100);
    };

    const handleShare = async () => {
        setOptionsModalVisible(false);
        setTimeout(() => setShareModalVisible(true), 100);
    };

    const handleShareImage = async () => {
        try {
            const uri = await captureRef(viewShotRef, { format: 'png', quality: 1.0 });
            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error('Sharing failed', error);
        }
    };

    const getContentText = () => {
        if (!selectedAyah || !allEditionsData) return '';
        const indexInSurah = selectedAyah.ns - 1;
        if (modalContentType === 'tafsir') {
            const tafsirEd = allEditionsData.find(e => e.e.id === 'ar.muyassar');
            return tafsirEd?.a[indexInSurah]?.t || '';
        } else {
            const transEd = allEditionsData.find(e => e.e.id === 'en.pickthall');
            return transEd?.a[indexInSurah]?.t || '';
        }
    };

    const renderPage = ({ item }: any) => {
        return (
            <View style={styles.pageContainer}>
                {/* Surah Header if it's the beginning of the Surah */}
                {item.ayahs[0].ns === 1 && (
                    <View style={styles.surahDivider}>
                        <Text style={[styles.surahTitlePro, { color: Colors.secondary }]}>{arabicName}</Text>
                        {number !== 1 && number !== 9 && (
                            <Text style={[styles.bismillahPro, { color: Colors.secondary }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                        )}
                    </View>
                )}

                <View style={styles.mushafPageFrame}>
                    <Text style={[styles.mushafTextPage, { color: activeColors.text }]}>
                        {item.ayahs.map((ayah: any) => {
                            const isPlaying = playingAyah === ayah.n;
                            const isBookmarked = bookmarks.some(b => b.surahNumber === number && b.ayahNumber === ayah.ns);

                            return (
                                <Text key={ayah.n} onPress={() => { setSelectedAyah(ayah); setOptionsModalVisible(true); }}>
                                    <Text style={[
                                        styles.arabicTextInline,
                                        {
                                            color: isPlaying ? Colors.secondary : (isBookmarked ? Colors.accent : activeColors.text),
                                            backgroundColor: isPlaying ? Colors.secondary + '20' : 'transparent'
                                        }
                                    ]}>
                                        {ayah.t}
                                    </Text>
                                    <Text style={[styles.ayahMarkerInline, { color: Colors.secondary }]}>
                                        {" "}({ayah.ns}){" "}
                                    </Text>
                                </Text>
                            );
                        })}
                    </Text>
                </View>
                <Text style={[styles.pageNumberBottom, { color: activeColors.textMuted }]}>{item.page}</Text>
            </View>
        );
    };

    if (loading) return <View style={[styles.center, { backgroundColor: activeColors.background }]}><ActivityIndicator size="large" color={Colors.secondary} /></View>;

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ImageBackground
                source={require('../../assets/mushaf_bg.png')}
                style={{ flex: 1 }}
                imageStyle={{ opacity: isDark ? 0.05 : 0.08 }}
            >
                <View style={[styles.proHeader, { borderBottomColor: activeColors.border + '20', backgroundColor: 'transparent', paddingTop: insets.top, height: 70 + insets.top }]}>
                    <TouchableOpacity onPress={onBack} style={styles.proBackBtn}><ChevronLeft size={28} color={Colors.secondary} /></TouchableOpacity>
                    <View style={styles.proHeaderInfo}>
                        <Text style={[styles.proHeaderText, { color: activeColors.textMuted }]}>{lang === 'ar' ? `الجزء ${visibleMetadata.juz}` : `Juz ${visibleMetadata.juz}`}</Text>
                        <Text style={[styles.proHeaderTitle, { color: Colors.secondary }]}>{visibleMetadata.surahName}</Text>
                        <Text style={[styles.proHeaderText, { color: activeColors.textMuted }]}>{lang === 'ar' ? `صفحة ${visibleMetadata.page}` : `Page ${visibleMetadata.page}`}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <FlatList
                    ref={flatListRef}
                    data={pageList}
                    keyExtractor={(item) => item.page.toString()}
                    renderItem={renderPage}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 10, paddingBottom: 50 }}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                        }, 500);
                    }}
                />
            </ImageBackground>

            {/* Options Modal (Bottom Sheet style) */}
            <Modal transparent visible={optionsModalVisible} animationType="slide" onRequestClose={() => setOptionsModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
                    <View style={[styles.optionsSheet, { backgroundColor: activeColors.surface }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: activeColors.textMuted }]} />
                        <Text style={[styles.sheetTitle, { color: Colors.secondary }]}>{arabicName} ({selectedAyah?.ns})</Text>

                        <View style={styles.optionsGrid}>
                            <TouchableOpacity style={styles.optItem} onPress={() => handlePlayAudio(selectedAyah)}>
                                <View style={[styles.optIcon, { backgroundColor: Colors.secondary + '15' }]}><Play size={24} color={Colors.secondary} /></View>
                                <Text style={[styles.optLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'استماع' : 'Audio'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optItem} onPress={() => handleShowContent('tafsir')}>
                                <View style={[styles.optIcon, { backgroundColor: Colors.accent + '15' }]}><BookOpen size={24} color={Colors.accent} /></View>
                                <Text style={[styles.optLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'تفسير' : 'Tafsir'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optItem} onPress={() => handleShowContent('translation')}>
                                <View style={[styles.optIcon, { backgroundColor: '#4A90E215' }]}><Languages size={24} color="#4A90E2" /></View>
                                <Text style={[styles.optLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'ترجمة' : 'Translation'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optItem} onPress={handleToggleBookmark}>
                                <View style={[styles.optIcon, { backgroundColor: Colors.secondary + '15' }]}>
                                    <Bookmark
                                        size={24}
                                        color={Colors.secondary}
                                        fill={bookmarks.some(b => b.surahNumber === number && b.ayahNumber === selectedAyah?.ns) ? Colors.secondary : 'transparent'}
                                    />
                                </View>
                                <Text style={[styles.optLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'حفظ' : 'Save'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optItem} onPress={handleShare}>
                                <View style={[styles.optIcon, { backgroundColor: '#FF6B6B15' }]}><Share2 size={24} color="#FF6B6B" /></View>
                                <Text style={[styles.optLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'مشاركة' : 'Share'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Content Display Modal (Tafsir/Translation) */}
            <Modal transparent visible={contentModalVisible} animationType="fade" onRequestClose={() => setContentModalVisible(false)}>
                <View style={styles.modalOverlayDark}>
                    <View style={[styles.contentModal, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.contentHeader}>
                            <Text style={[styles.contentTitle, { color: Colors.secondary }]}>
                                {modalContentType === 'tafsir' ? (lang === 'ar' ? 'تفسير الجلالين' : 'Tafsir Muyassar') : (lang === 'ar' ? 'ترجمة معاني' : 'English Translation')}
                            </Text>
                            <TouchableOpacity onPress={() => setContentModalVisible(false)}><X size={24} color={activeColors.text} /></TouchableOpacity>
                        </View>
                        <ScrollView style={styles.contentScroll}>
                            <Text style={[styles.contentArabic, { color: activeColors.text }]}>{selectedAyah?.t}</Text>
                            <View style={[styles.contentDivider, { backgroundColor: activeColors.border }]} />
                            <Text style={[styles.contentText, { color: activeColors.text, textAlign: modalContentType === 'tafsir' ? 'right' : 'left' }]}>
                                {getContentText()}
                            </Text>
                        </ScrollView>
                        <TouchableOpacity style={[styles.contentCloseBtn, { backgroundColor: Colors.secondary }]} onPress={() => setContentModalVisible(false)}>
                            <Text style={styles.contentCloseText}>{lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Share Modal */}
            <Modal transparent visible={shareModalVisible} animationType="fade" onRequestClose={() => setShareModalVisible(false)}>
                <View style={styles.modalOverlayDark}>
                    <View style={[styles.shareModalContent, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.contentHeader}>
                            <Text style={[styles.contentTitle, { color: activeColors.text }]}>{lang === 'ar' ? 'مشاركة الآية' : 'Share Ayah'}</Text>
                            <TouchableOpacity onPress={() => setShareModalVisible(false)}><X size={24} color={activeColors.text} /></TouchableOpacity>
                        </View>

                        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={[styles.shareCardPro, { backgroundColor: Colors.secondary }]}>
                                <Text style={styles.shareCardHeader}>القرآن الكريم</Text>
                                <Text style={styles.shareCardArabic}>{selectedAyah?.t}</Text>
                                <Text style={styles.shareCardRef}>{arabicName} [{selectedAyah?.ns}]</Text>
                            </View>
                        </ViewShot>

                        <TouchableOpacity style={[styles.shareActionBtn, { backgroundColor: Colors.secondary }]} onPress={handleShareImage}>
                            <Download size={20} color="#000" />
                            <Text style={styles.shareActionText}>{lang === 'ar' ? 'حفظ كصورة' : 'Save as Image'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.shareActionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.secondary }]}
                            onPress={() => {
                                Share.share({ message: `${selectedAyah?.t}\n\n[${arabicName} : ${selectedAyah?.ns}]` });
                                setShareModalVisible(false);
                            }}
                        >
                            <Copy size={20} color={Colors.secondary} />
                            <Text style={[styles.shareActionText, { color: Colors.secondary }]}>{lang === 'ar' ? 'نسخ النص' : 'Copy Text'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    proHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: 1, zIndex: 10 },
    proBackBtn: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
    proHeaderInfo: { flex: 1, alignItems: 'center' },
    proHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
    proHeaderText: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
    pageContainer: { marginBottom: 60 },
    surahDivider: { alignItems: 'center', marginTop: 20, marginBottom: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 175, 55, 0.1)', paddingBottom: 25 },
    surahTitlePro: { fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
    bismillahPro: { fontSize: 26, textAlign: 'center' },
    mushafPageFrame: { paddingHorizontal: 5 },
    mushafTextPage: { textAlign: 'right', writingDirection: 'rtl' },
    arabicTextInline: { fontSize: 26, lineHeight: 62, fontWeight: '500', fontFamily: Platform.OS === 'android' ? 'serif' : 'System' },
    ayahMarkerInline: { fontSize: 18, fontWeight: 'bold' },
    pageNumberBottom: { textAlign: 'center', marginTop: 25, fontSize: 13, fontWeight: 'bold', opacity: 0.4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    optionsSheet: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 60 },
    sheetHandle: { width: 45, height: 6, borderRadius: 3, alignSelf: 'center', marginBottom: 25, opacity: 0.15 },
    sheetTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
    optionsGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    optItem: { alignItems: 'center', width: '20%' },
    optIcon: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    optLabel: { fontSize: 11, fontWeight: 'bold' },
    contentModal: { width: '100%', borderRadius: 25, padding: 20, maxHeight: '80%' },
    contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    contentTitle: { fontSize: 18, fontWeight: 'bold' },
    contentScroll: { marginBottom: 20 },
    contentArabic: { fontSize: 22, textAlign: 'right', lineHeight: 40, marginBottom: 20 },
    contentDivider: { height: 1, width: '100%', marginBottom: 20, opacity: 0.1 },
    contentText: { fontSize: 17, lineHeight: 28 },
    contentCloseBtn: { paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    contentCloseText: { fontWeight: 'bold', fontSize: 16, color: '#000' },
    shareModalContent: { width: '100%', borderRadius: 30, padding: 25 },
    shareCardPro: { padding: 30, borderRadius: 25, alignItems: 'center', marginBottom: 25 },
    shareCardHeader: { color: 'rgba(0,0,0,0.4)', fontWeight: 'bold', fontSize: 12, marginBottom: 20, letterSpacing: 2 },
    shareCardArabic: { color: '#000', fontSize: 22, fontWeight: 'bold', textAlign: 'center', lineHeight: 45, marginBottom: 25 },
    shareCardRef: { color: '#000', fontSize: 14, fontWeight: 'bold', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 15, width: '100%', textAlign: 'center' },
    shareActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, marginBottom: 12 },
    shareActionText: { fontWeight: 'bold', fontSize: 15, marginLeft: 10, color: '#000' }
});

export default SurahDetailScreen;
