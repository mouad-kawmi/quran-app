import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert, Modal, Share, Image } from 'react-native';
import { fetchSurahDetail } from '../api/quranApi';
import { Storage } from '../utils/storage';
import { Colors } from '../constants/Colors';
import { Translations } from '../constants/Translations';
import { Audio } from 'expo-av';
import { ChevronLeft, Play, Pause, Bookmark, Share2, Download, X, Heart, WifiOff, AlertTriangle } from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const SurahDetailScreen = ({ route, onBack, lang, theme }: any) => {
    const { number, name, arabicName, startAyah } = route.params;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [displayMode, setDisplayMode] = useState<'translation' | 'tafsir'>('translation');
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const isInitialScrollDone = useRef(false);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [ayahToShare, setAyahToShare] = useState<any>(null);
    const [offlineModalVisible, setOfflineModalVisible] = useState(false);
    const flatListRef = useRef<any>(null);
    const soundRef = useRef<any>(null);
    const viewShotRef = useRef<any>(null);

    const t = Translations[lang];
    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    const handleShareImage = async () => {
        try {
            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 1.0,
            });

            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error('Sharing failed', error);
            Alert.alert('Error', 'Failed to generate share card.');
        }
    };

    const openShareCard = (ayah: any, textAr: string, textEn: string) => {
        setAyahToShare({ ...ayah, textAr, textEn });
        setShareModalVisible(true);
    };

    useEffect(() => {
        loadDetail();
        loadBookmarks();
        // Setup Audio Mode for better device support
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: 1, // DoNotMix
            shouldDuckAndroid: true,
            interruptionModeAndroid: 1, // DoNotMix
            playThroughEarpieceAndroid: false,
        }).catch(e => console.log('Audio mode error', e));

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, [number]);

    const loadBookmarks = async () => {
        const b = await Storage.getBookmarks();
        setBookmarks(b);
    };

    const loadDetail = async () => {
        setLoading(true);
        try {
            // 1️⃣ نشوفو فالكاش أولاً
            const cached = await Storage.getSurahCache(number);
            if (cached) {
                setData(cached);
                setLoading(false);

                if (startAyah && startAyah > 1) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: startAyah - 1, animated: true, viewPosition: 0 });
                        isInitialScrollDone.current = true;
                    }, 1000);
                } else {
                    isInitialScrollDone.current = true;
                }
                return;
            }

            // 2️⃣ إلا ما لقيناش كاش كنحملو من الAPI
            const fullDetails = await fetchSurahDetail(number);

            // Critical Fix: Minimize using the same compressed keys as HomeScreen
            const minimizedDetails = fullDetails.map((edition: any) => ({
                e: { id: edition.edition.identifier },
                a: edition.ayahs.map((a: any) => ({
                    n: a.number,
                    ns: a.numberInSurah,
                    t: a.text
                }))
            }));

            setData(minimizedDetails);

            // 3️⃣ نحفظوها للمرة الجاي - safer and non-blocking
            try {
                await Storage.saveSurahCache(number, minimizedDetails);
            } catch (e) {
                console.log("Saving cache failed:", e);
            }

            if (startAyah && startAyah > 1) {
                console.log(`[Scroll] Scrolling to Ayah ${startAyah}`);
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: startAyah - 1,
                        animated: true,
                        viewPosition: 0
                    });
                    isInitialScrollDone.current = true;
                }, 1200);
            } else {
                isInitialScrollDone.current = true;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        // Only track and save if the initial scroll (jump to last read) is finished
        if (isInitialScrollDone.current && viewableItems && viewableItems.length > 0) {
            const firstVisible = viewableItems[0].item;
            if (firstVisible) {
                // Critical Fix: Use 'ns' for compressed data or 'numberInSurah' for old data
                const currentAyahNum = firstVisible.ns || firstVisible.numberInSurah;

                if (currentAyahNum) {
                    Storage.saveLastRead({
                        number,
                        name,
                        arabicName,
                        ayahNumber: currentAyahNum
                    });
                }
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 20 // More sensitive to tracking
    }).current;

    const playNextAyah = (currentGlobalNumber: number) => {
        if (!data || !data[0]?.a) return;
        const ayahs = data[0].a;
        const currentIndex = ayahs.findIndex((a: any) => a.n === currentGlobalNumber);
        if (currentIndex !== -1 && currentIndex < ayahs.length - 1) {
            const nextAyah = ayahs[currentIndex + 1];
            // Small delay to prevent overlap issues
            setTimeout(() => {
                handlePlayAudio(nextAyah.n);
            }, 300);

            // Scroll to next ayah
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
                viewPosition: 0.3
            });
        } else {
            setPlayingAyah(null);
        }
    };

    const fastCheckConnection = async () => {
        try {
            // Fast ping to a reliable CDN with a short timeout
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2500);
            await fetch('https://everyayah.com', { method: 'HEAD', signal: controller.signal });
            clearTimeout(id);
            return true;
        } catch (e) {
            return false;
        }
    };

    const handlePlayAudio = async (ayahGlobalNumber: number) => {
        try {
            if (!data) return;

            // Stop current immediately for better responsiveness
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            if (playingAyah === ayahGlobalNumber) {
                setPlayingAyah(null);
                return;
            }

            // Quick network check before loading
            const isOnline = await fastCheckConnection();
            if (!isOnline) {
                setOfflineModalVisible(true);
                return;
            }

            setPlayingAyah(ayahGlobalNumber);

            const currentAyah = data[0].a.find((a: any) => a.n === ayahGlobalNumber);
            if (!currentAyah) return;

            const surahPadded = number.toString().padStart(3, '0');
            const ayahPadded = currentAyah.ns.toString().padStart(3, '0');
            const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`;

            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true, volume: 1.0 },
                (status: any) => {
                    if (status.isLoaded && status.didJustFinish) {
                        playNextAyah(ayahGlobalNumber);
                    }
                }
            );

            soundRef.current = sound;
        } catch (error) {
            console.error('[Audio] Error:', error);
            setPlayingAyah(null);
            setOfflineModalVisible(true);
        }
    };

    const handleBookmark = async (item: any) => {
        const currentBookmarks = await Storage.getBookmarks();
        const exists = currentBookmarks.find(b => b.surahNumber === number && b.ayahNumber === item.ns);

        if (exists) {
            const filtered = currentBookmarks.filter(b => !(b.surahNumber === number && b.ayahNumber === item.ns));
            await Storage.saveBookmarks(filtered);
            setBookmarks(filtered);
            // Optional: Alert.alert(lang === 'ar' ? "تم الإزالة" : "Removed", lang === 'ar' ? "تم إزالة الآية من المفضلة." : "Ayah removed from bookmarks.");
        } else {
            const newBookmark = {
                surahNumber: number,
                surahName: name,
                ayahNumber: item.ns,
                text: item.t,
                date: new Date().toISOString()
            };
            const updated = [...currentBookmarks, newBookmark];
            await Storage.saveBookmarks(updated);
            setBookmarks(updated);
            // Optional: Alert.alert(lang === 'ar' ? "تم الحفظ" : "Saved", lang === 'ar' ? "تم حفظ الآية في المفضلة." : "Ayah bookmarked successfully.");
        }
    };

    const renderAyah = ({ item, index }: any) => {
        if (!data || data.length < 3) return null;

        const getEditionText = (id: string) => {
            const ed = data.find((e: any) => (e.e?.id || e.edition?.identifier) === id);
            if (!ed) return '';

            // Try both compressed and uncompressed formats for survival
            const ayahs = ed.a || ed.ayahs;
            const ayah = ayahs?.[index];
            return ayah ? (ayah.t || ayah.text) : '';
        };

        const translation = getEditionText('en.pickthall');
        const tafsir = lang === 'ar' ? getEditionText('ar.muyassar') : getEditionText('en.pickthall');

        const isPlaying = playingAyah === item.n;

        return (
            <View style={[
                styles.ayahContainer,
                { backgroundColor: activeColors.surface },
                isPlaying && { borderColor: Colors.secondary, borderWidth: 1 }
            ]}>
                <View style={styles.ayahHeader}>
                    <View style={[styles.numberBadge, { backgroundColor: isPlaying ? Colors.secondary : activeColors.surfaceLight }]}>
                        <Text style={[styles.numberText, { color: isPlaying ? Colors.dark.background : activeColors.text }]}>{item.ns}</Text>
                    </View>
                    <View style={styles.actionIcons}>
                        <TouchableOpacity onPress={() => openShareCard(item, item.t, translation)} style={styles.iconBtn}>
                            <Share2 size={20} color={activeColors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handlePlayAudio(item.n)} style={styles.iconBtn}>
                            {isPlaying ? (
                                <Pause size={20} color={Colors.secondary} />
                            ) : (
                                <Play size={20} color={Colors.secondary} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleBookmark(item)} style={styles.iconBtn}>
                            <Bookmark
                                size={20}
                                color={Colors.secondary}
                                fill={bookmarks.some(b => b.surahNumber === number && b.ayahNumber === item.ns) ? Colors.secondary : 'transparent'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.arabicText, { color: activeColors.text }, isPlaying && { color: Colors.secondary }]}>{item.t}</Text>
                <Text style={[styles.translationText, { color: activeColors.textMuted }]}>
                    {displayMode === 'translation' ? translation : tafsir}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={[styles.container, { backgroundColor: activeColors.background }]}>
                <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <ChevronLeft size={28} color={Colors.secondary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: Colors.secondary }]}>
                        {lang === 'ar' ? arabicName : name}
                    </Text>
                    <View style={{ width: 50 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
                    <Text style={[styles.errorText, { color: activeColors.text }]}>
                        {lang === 'ar' ? 'عذراً، هذه السورة غير محملة.' : 'Sorry, this Surah is not downloaded.'}
                    </Text>
                    <Text style={[styles.errorSub, { color: activeColors.textMuted }]}>
                        {lang === 'ar'
                            ? 'يجب فتح السورة مرة واحدة على الأقل بالإنترنت ليتم حفظها تلقائياً.'
                            : 'You need to open this Surah at least once with internet to save it automatically.'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: Colors.secondary }]}
                        onPress={loadDetail}
                    >
                        <Text style={{ color: Colors.dark.background, fontWeight: 'bold' }}>{lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.secondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.secondary }]}>
                    {lang === 'ar' ? arabicName : name}
                </Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={[styles.modeSelector, { backgroundColor: activeColors.surfaceLight }]}>
                <TouchableOpacity
                    style={[styles.modeBtn, displayMode === 'translation' && { backgroundColor: Colors.secondary }]}
                    onPress={() => setDisplayMode('translation')}
                >
                    <Text style={[styles.modeText, displayMode === 'translation' && { color: Colors.dark.background }]}>{t.translation}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeBtn, displayMode === 'tafsir' && { backgroundColor: Colors.secondary }]}
                    onPress={() => setDisplayMode('tafsir')}
                >
                    <Text style={[styles.modeText, displayMode === 'tafsir' && { color: Colors.dark.background }]}>{t.tafsir}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={data ? (data[0].a || data[0].ayahs) : []}
                keyExtractor={(item) => (item.n || item.number).toString()}
                renderItem={renderAyah}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    }, 500);
                }}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={styles.listContent}
                initialNumToRender={startAyah ? startAyah + 5 : 10}
                maxToRenderPerBatch={10}
                windowSize={5}
                ListHeaderComponent={() => (
                    <View style={styles.bismillahContainer}>
                        {number !== 1 && <Text style={[styles.bismillahText, { color: Colors.secondary }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>}
                    </View>
                )}
                ListEmptyComponent={() => (
                    !loading ? (
                        <View style={styles.errorContainer}>
                            <Heart size={40} color={activeColors.textMuted} style={{ marginBottom: 20, opacity: 0.3 }} />
                            <Text style={[styles.errorText, { color: activeColors.text }]}>
                                {lang === 'ar' ? 'عذراً، لم يتم تحميل الآيات.' : 'Sorry, ayahs could not be loaded.'}
                            </Text>
                            <Text style={[styles.errorSub, { color: activeColors.textMuted }]}>
                                {lang === 'ar' ? 'تأكد من الاتصال بالإنترنت وحاول مرة أخرى.' : 'Check your connection and try again.'}
                            </Text>
                            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Colors.secondary }]} onPress={loadDetail}>
                                <Text style={styles.retryBtnText}>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                )}
            />

            {/* SHARE CARD MODAL */}
            <Modal
                transparent
                visible={shareModalVisible}
                animationType="fade"
                onRequestClose={() => setShareModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: activeColors.text }]}>
                                {lang === 'ar' ? 'بطاقة الآية' : 'Ayah Card'}
                            </Text>
                            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                <X size={24} color={activeColors.text} />
                            </TouchableOpacity>
                        </View>

                        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={[styles.shareCard, { backgroundColor: Colors.secondary }]}>
                                <Text style={styles.cardLogo}>القرآن الكريم</Text>
                                <Text style={styles.cardArabic}>{ayahToShare?.textAr}</Text>
                                <Text style={styles.cardTranslation}>{ayahToShare?.textEn}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardRef}>{lang === 'ar' ? arabicName : name} [{ayahToShare?.numberInSurah}]</Text>
                                </View>
                            </View>
                        </ViewShot>

                        <TouchableOpacity
                            style={[styles.shareBtn, { backgroundColor: Colors.secondary }]}
                            onPress={handleShareImage}
                        >
                            <Download size={20} color={Colors.dark.background} />
                            <Text style={styles.shareBtnText}>
                                {lang === 'ar' ? 'مشاركة كصورة' : 'Share as Image'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* OFFLINE ERROR MODAL */}
            <Modal
                transparent
                visible={offlineModalVisible}
                animationType="slide"
                onRequestClose={() => setOfflineModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.offlineCard, { backgroundColor: activeColors.background }]}>
                        <View style={[styles.offlineIconCircle, { backgroundColor: 'rgba(255,152,0,0.1)' }]}>
                            <WifiOff size={40} color="#FF9800" />
                        </View>
                        <Text style={[styles.offlineTitle, { color: activeColors.text }]}>{t.offlineTitle}</Text>
                        <Text style={[styles.offlineMessage, { color: activeColors.textMuted }]}>{t.offlineMessage}</Text>

                        <TouchableOpacity
                            style={[styles.offlineCloseBtn, { backgroundColor: Colors.secondary }]}
                            onPress={() => setOfflineModalVisible(false)}
                        >
                            <Text style={styles.offlineCloseText}>{lang === 'ar' ? 'فهمت' : 'I Understand'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 8 },
    backButtonText: { fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    modeSelector: { flexDirection: 'row', margin: 16, borderRadius: 12, padding: 4 },
    modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    modeText: { fontSize: 14, fontWeight: 'bold', color: '#B7D1C4' },
    listContent: { padding: 16 },
    bismillahContainer: { paddingVertical: 20, alignItems: 'center' },
    bismillahText: { fontSize: 24, textAlign: 'center' },
    ayahContainer: { marginBottom: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    actionIcons: { flexDirection: 'row' },
    iconBtn: { marginLeft: 15 },
    numberBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    numberText: { fontSize: 12, fontWeight: 'bold' },
    arabicText: { fontSize: 24, lineHeight: 45, textAlign: 'right', marginBottom: 15 },
    translationText: { fontSize: 15, lineHeight: 24 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    retryBtn: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12, marginTop: 25 },
    retryBtnText: { color: '#081C15', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
    modalContent: { borderRadius: 25, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    shareCard: { padding: 30, borderRadius: 25, alignItems: 'center' },
    cardLogo: { color: 'rgba(8, 28, 21, 0.5)', fontWeight: 'bold', fontSize: 12, marginBottom: 20, letterSpacing: 2 },
    cardArabic: { color: '#081C15', fontSize: 22, fontWeight: 'bold', textAlign: 'center', lineHeight: 40, marginBottom: 20 },
    cardTranslation: { color: '#081C15', fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
    cardFooter: { marginTop: 30, width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 15 },
    cardRef: { color: '#081C15', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 15, marginTop: 20 },
    shareBtnText: { color: '#081C15', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    // Offline Styles
    offlineCard: { padding: 30, borderRadius: 30, alignItems: 'center' },
    offlineIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    offlineTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    offlineMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    offlineCloseBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15, width: '100%', alignItems: 'center' },
    offlineCloseText: { color: '#081C15', fontWeight: 'bold', fontSize: 16 },
});

export default SurahDetailScreen;
