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
import axios from 'axios';
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

const PortionReaderScreen = ({ juzList, onComplete, onBack, lang, theme, reciter }: any) => {
    const [pageList, setPageList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentJuzIndex, setCurrentJuzIndex] = useState(0);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [isDiskFull, setIsDiskFull] = useState(false);

    // Modal States
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [selectedAyah, setSelectedAyah] = useState<any>(null);
    const [contentModalVisible, setContentModalVisible] = useState(false);
    const [modalContentType, setModalContentType] = useState<'translation' | 'tafsir'>('translation');
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [allEditionsData, setAllEditionsData] = useState<any[]>([]);
    const [visibleMetadata, setVisibleMetadata] = useState<any>({ page: 0, juz: juzList[0], surahName: '' });

    const flatListRef = useRef<any>(null);
    const soundRef = useRef<any>(null);
    const viewShotRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;
    const t = Translations[lang];

    useEffect(() => {
        loadPortionData();
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
    }, [currentJuzIndex]);

    const loadBookmarks = async () => {
        const b = await Storage.getBookmarks();
        setBookmarks(b);
    };

    const loadPortionData = async () => {
        setLoading(true);
        setIsDiskFull(false);
        try {
            const juzNum = juzList[currentJuzIndex];

            // 1. Check Cache
            let cachedData = await Storage.getJuzCache(juzNum);
            let ayahs = null;

            if (cachedData) {
                if (Array.isArray(cachedData) && cachedData[0].e) {
                    setAllEditionsData(cachedData);
                    const uthmani = cachedData.find((e: any) => e.e.id.includes('uthmani') || e.e.id.includes('simple'));
                    ayahs = uthmani ? uthmani.a : null;
                }
            }

            if (!ayahs) {
                const resUthmani = await axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/quran-uthmani`, { timeout: 15000 });

                if (resUthmani.data && resUthmani.data.data) {
                    const uthmaniRaw = resUthmani.data.data;

                    const [resTrans, resTafsir] = await Promise.allSettled([
                        axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/en.pickthall`),
                        axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/ar.muyassar`)
                    ]);

                    const editions: any[] = [];
                    editions.push({
                        e: { id: 'quran-uthmani' },
                        a: uthmaniRaw.ayahs.map((a: any) => ({
                            n: a.number,
                            ns: a.numberInSurah,
                            t: a.text,
                            p: a.page,
                            j: a.juz,
                            s: { n: a.surah.number, sn: a.surah.name }
                        }))
                    });

                    if (resTrans.status === 'fulfilled') {
                        editions.push({
                            e: { id: 'en.pickthall' },
                            a: resTrans.value.data.data.ayahs.map((a: any) => ({ n: a.number, t: a.text }))
                        });
                    }

                    if (resTafsir.status === 'fulfilled') {
                        editions.push({
                            e: { id: 'ar.muyassar' },
                            a: resTafsir.value.data.data.ayahs.map((a: any) => ({ n: a.number, t: a.text }))
                        });
                    }

                    try {
                        await Storage.saveJuzCache(juzNum, editions);
                    } catch (storageError: any) {
                        if (storageError.message?.includes('full')) {
                            setIsDiskFull(true);
                        }
                    }

                    setAllEditionsData(editions);
                    ayahs = editions[0].a;
                }
            }

            if (ayahs) {
                const processedPages = processToPages(ayahs);
                setPageList(processedPages);
                
                // Set initial metadata immediately
                const firstAyah = ayahs[0];
                if (firstAyah) {
                    setVisibleMetadata({
                        page: firstAyah.p || firstAyah.page || 0,
                        juz: firstAyah.j || firstAyah.juz || juzNum,
                        surahName: firstAyah.s?.sn || firstAyah.surah?.name || ''
                    });
                }
            }
        } catch (error: any) {
            console.error("[Khatma Reader] Error loading portion:", error);
            if (error.message?.includes('full')) {
                setIsDiskFull(true);
            } else {
                Alert.alert(t.errorTitle || "Error", t.errorSub || "Please check internet connection");
            }
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
        if (viewableItems && viewableItems.length > 0) {
            const firstPage = viewableItems[0].item;
            const firstAyah = firstPage.ayahs[0];
            if (firstAyah) {
                setVisibleMetadata({
                    page: firstPage.page,
                    juz: firstAyah.j || firstAyah.juz,
                    surahName: firstAyah.s?.sn || firstAyah.surah?.name
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
            const surahPadded = ayah.s.n.toString().padStart(3, '0');
            const ayahPadded = ayah.ns.toString().padStart(3, '0');
            const reciterId = reciter || 'Alafasy_128kbps';
            const audioUrl = `https://everyayah.com/data/${reciterId}/${surahPadded}${ayahPadded}.mp3`;

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
        const exists = currentBookmarks.some(b => b.surahNumber === selectedAyah.s.n && b.ayahNumber === selectedAyah.ns);

        if (exists) {
            const filtered = currentBookmarks.filter(b => !(b.surahNumber === selectedAyah.s.n && b.ayahNumber === selectedAyah.ns));
            await Storage.saveBookmarks(filtered);
            setBookmarks(filtered);
        } else {
            const newBookmark = {
                surahNumber: selectedAyah.s.n,
                surahName: selectedAyah.s.sn,
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
        const targetAyahNumber = selectedAyah.n;
        if (modalContentType === 'tafsir') {
            const tafsirEd = allEditionsData.find(e => e.e.id === 'ar.muyassar' || e.e.id === 'quran-uthmani');
            const ayahData = tafsirEd?.a.find((a: any) => a.n === targetAyahNumber);
            return ayahData?.t || '';
        } else {
            const transEd = allEditionsData.find(e => e.e.id === 'en.pickthall');
            const ayahData = transEd?.a.find((a: any) => a.n === targetAyahNumber);
            return ayahData?.t || '';
        }
    };

    const renderPage = ({ item }: any) => {
        return (
            <View style={styles.pageContainer}>
                {item.ayahs[0].ns === 1 && (
                    <View style={styles.surahDivider}>
                        <Text style={[styles.surahTitlePro, { color: Colors.secondary }]}>{item.ayahs[0].s.sn}</Text>
                        {item.ayahs[0].s.n !== 1 && item.ayahs[0].s.n !== 9 && (
                            <Text style={[styles.bismillahPro, { color: Colors.secondary }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                        )}
                    </View>
                )}
                <View style={styles.mushafPageFrame}>
                    <Text style={[styles.mushafTextPage, { color: activeColors.text }]}>
                        {item.ayahs.map((ayah: any) => {
                            const isPlaying = playingAyah === ayah.n;
                            const isBookmarked = bookmarks.some(b => b.surahNumber === ayah.s.n && b.ayahNumber === ayah.ns);

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

    if (isDiskFull) {
        return (
            <View style={[styles.container, { backgroundColor: activeColors.background }]}>
                <View style={[styles.proHeader, { paddingTop: insets.top, backgroundColor: activeColors.background }]}>
                    <TouchableOpacity onPress={onBack} style={styles.proBackBtn}><ChevronLeft size={24} color={Colors.secondary} /></TouchableOpacity>
                    <Text style={[styles.proHeaderTitle, { color: Colors.secondary }]}>{lang === 'ar' ? 'مشكلة الذاكرة' : 'Storage Error'}</Text>
                </View>
                <View style={styles.errorBox}>
                    <WifiOff size={60} color={activeColors.textMuted} />
                    <Text style={[styles.errorTitle, { color: activeColors.text }]}>{lang === 'ar' ? 'الذاكرة ممتلئة' : 'Disk is Full'}</Text>
                    <Text style={[styles.errorSub, { color: activeColors.textMuted }]}>
                        {lang === 'ar'
                            ? 'ذاكرة التطبيق ممتلئة ولا يمكن تحميل المزيد. يرجى الذهاب للإعدادات ومسح الذاكرة المؤقتة (Clear Cache) أو إعادة ضبط التطبيق.'
                            : 'The app storage is full. Please go to Settings and Clear Cache or Reset App to free up space.'}
                    </Text>
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Colors.secondary }]} onPress={onBack}>
                        <Text style={styles.retryBtnText}>{lang === 'ar' ? 'العودة للإعدادات' : 'Go back'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ImageBackground
                source={require('../../assets/mushaf_bg.png')}
                style={{ flex: 1 }}
                imageStyle={{ opacity: isDark ? 0.05 : 0.08 }}
            >
                <View style={[styles.proHeader, { borderBottomColor: activeColors.border + '20', backgroundColor: 'transparent', paddingTop: insets.top, height: 75 + insets.top }]}>
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
                    ListFooterComponent={() => (
                        <View style={styles.footerPro}>
                            <CheckCircle size={50} color={Colors.secondary} style={{ marginBottom: 15 }} />
                            <Text style={[styles.footerH1, { color: activeColors.text }]}>{lang === 'ar' ? 'تقبل الله منك!' : 'Taqabbala Allah!'}</Text>
                            <Text style={[styles.footerP, { color: activeColors.textMuted }]}>{lang === 'ar' ? 'أتممت ورد هذا الجزء بنجاح.' : 'You have completed this portion successfully.'}</Text>
                            <TouchableOpacity style={[styles.completeBtn, { backgroundColor: Colors.secondary }]} onPress={onComplete}>
                                <Text style={styles.completeBtnText}>{lang === 'ar' ? 'إنهاء الورد' : 'Finish Reading'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />

                <View style={[styles.proFooter, { backgroundColor: 'transparent', paddingBottom: insets.bottom + 10, height: 80 + insets.bottom }]}>
                    <Text style={[styles.proFooterText, { color: activeColors.textMuted, flex: 1, textAlign: 'left' }]}>
                        {lang === 'ar' ? 'الختمة اليومية' : 'Daily Khatma'}
                    </Text>

                    <View style={styles.mushafPageOrnament}>
                        <View style={[styles.ornamentCircle, { borderColor: Colors.secondary }]}>
                            <Text style={[styles.ornamentText, { color: Colors.secondary }]}>{visibleMetadata.page}</Text>
                        </View>
                    </View>

                    <Text style={[styles.proFooterText, { color: activeColors.textMuted, flex: 1, textAlign: 'right' }]}>
                        {currentJuzIndex + 1} / {juzList.length} {lang === 'ar' ? 'أجزاء' : 'Juzs'}
                    </Text>
                </View>
            </ImageBackground>

            {/* Options Modal */}
            <Modal transparent visible={optionsModalVisible} animationType="slide" onRequestClose={() => setOptionsModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
                    <View style={[styles.optionsSheet, { backgroundColor: activeColors.surface }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: activeColors.textMuted }]} />
                        <Text style={[styles.sheetTitle, { color: Colors.secondary }]}>{selectedAyah?.s.sn} ({selectedAyah?.ns})</Text>

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
                                        fill={bookmarks.some(b => b.surahNumber === selectedAyah?.s.n && b.ayahNumber === selectedAyah?.ns) ? Colors.secondary : 'transparent'}
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
                            <Text style={styles.contentCloseText}>{lang === 'ar' ? 'إإغلاق' : 'Close'}</Text>
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
                                <Text style={styles.shareCardRef}>{selectedAyah?.s.sn} [{selectedAyah?.ns}]</Text>
                            </View>
                        </ViewShot>

                        <TouchableOpacity style={[styles.shareActionBtn, { backgroundColor: Colors.secondary }]} onPress={handleShareImage}>
                            <Download size={20} color="#000" />
                            <Text style={styles.shareActionText}>{lang === 'ar' ? 'حفظ كصورة' : 'Save as Image'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.shareActionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.secondary }]}
                            onPress={() => {
                                Share.share({ message: `${selectedAyah?.t}\n\n[${selectedAyah?.s.sn} : ${selectedAyah?.ns}]` });
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
    footerPro: { alignItems: 'center', paddingVertical: 60, marginTop: 40, borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.1)' },
    footerH1: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    footerP: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
    completeBtn: { paddingVertical: 18, paddingHorizontal: 50, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    completeBtnText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
    proFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        width: width,
        borderTopWidth: 0,
    },
    proFooterText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        opacity: 0.7
    },
    mushafPageOrnament: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    ornamentCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    ornamentText: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'android' ? 'serif' : 'System',
    },
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
    shareActionText: { fontWeight: 'bold', fontSize: 15, marginLeft: 10, color: '#000' },
    errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    errorSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    retryBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    retryBtnText: { color: '#000', fontWeight: 'bold' },
});

export default PortionReaderScreen;
