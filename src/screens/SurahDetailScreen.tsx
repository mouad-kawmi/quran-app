import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, ImageBackground, StatusBar, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { fetchSurahDetail } from '../api/quranApi';
import { Storage } from '../utils/storage';
import { Colors } from '../constants/Colors';
import { WifiOff } from 'lucide-react-native';

// Components
import OptionsSheet from '../components/quran/OptionsSheet';
import ContentModal from '../components/quran/ContentModal';
import ShareModal from '../components/quran/ShareModal';
import DetailHeader from '../components/quran/DetailHeader';
import MushafPage from '../components/quran/MushafPage';

const SurahDetailScreen = ({ route, onBack, lang, theme, reciter }: any) => {
    const { number, name, arabicName, startAyah } = route.params;
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<any>(null);
    const soundRef = useRef<any>(null);
    const viewShotRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState<any[]>([]);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [selectedAyah, setSelectedAyah] = useState<any>(null);
    const [meta, setMeta] = useState({ page: 0, juz: 0 });
    const [modals, setModals] = useState({ options: false, content: false, share: false, type: 'translation' as any });
    const [editions, setEditions] = useState<any[]>([]);

    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true); setIsOffline(false);
            const b = await Storage.getBookmarks(); setBookmarks(b);
            try {
                let data = await Storage.getSurahCache(number);
                if (!data || !data[0]?.a[0]?.p) {
                    const full = await fetchSurahDetail(number);
                    data = full.map((e: any) => ({ e: { id: e.edition.identifier }, a: e.ayahs.map((a: any) => ({ n: a.number, ns: a.numberInSurah, t: a.text, p: a.page, j: a.juz, h: a.hizbQuarter })) }));
                    Storage.saveSurahCache(number, data);
                }
                setEditions(data);
                const uthmani = data[0].a;
                setMeta({ page: uthmani[0].p, juz: uthmani[0].j });
                const groups = uthmani.reduce((acc: any, a: any) => { (acc[a.p] = acc[a.p] || []).push(a); return acc; }, {});
                const pList = Object.keys(groups).sort((a, b) => +a - +b).map(p => ({ page: p, ayahs: groups[p] }));
                setPages(pList);
                if (startAyah > 1) {
                    const idx = pList.findIndex(p => p.ayahs.some((a: any) => a.ns === startAyah));
                    if (idx !== -1) setTimeout(() => flatListRef.current?.scrollToIndex({ index: idx, animated: false }), 800);
                }
            } catch (e) {
                console.log("Surah Detail Load Error:", e);
                setIsOffline(true);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
    }, [number]);

    const onPlay = async (ayah: any) => {
        try {
            if (soundRef.current) await soundRef.current.unloadAsync();
            if (playingAyah === ayah.n) return setPlayingAyah(null);
            setPlayingAyah(ayah.n);
            const url = `https://everyayah.com/data/${reciter}/${number.toString().padStart(3, '0')}${ayah.ns.toString().padStart(3, '0')}.mp3`;
            const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }, (s: any) => {
                if (s.didJustFinish) {
                    const uthmani = editions[0].a;
                    const idx = uthmani.findIndex((a: any) => a.n === ayah.n);
                    if (idx !== -1 && idx < uthmani.length - 1) onPlay(uthmani[idx + 1]);
                    else setPlayingAyah(null);
                }
            });
            soundRef.current = sound;
            setModals({ ...modals, options: false });
        } catch (e) { setPlayingAyah(null); }
    };

    const onBookmark = async () => {
        if (!selectedAyah) return;
        const current = await Storage.getBookmarks();
        const idx = current.findIndex(b => b.surahNumber === number && b.ayahNumber === selectedAyah.ns);
        const updated = idx > -1 ? current.filter((_, i) => i !== idx) : [...current, { surahNumber: number, surahName: name, ayahNumber: selectedAyah.ns, text: selectedAyah.t, date: new Date().toISOString() }];
        await Storage.saveBookmarks(updated); setBookmarks(updated); setModals({ ...modals, options: false });
    };

    const getContentText = () => {
        if (!selectedAyah) return '';
        const edId = modals.type === 'tafsir' ? 'ar.muyassar' : 'en.pickthall';
        return editions.find(e => e.e.id === edId)?.a[selectedAyah.ns - 1]?.t || '';
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.secondary} /></View>;

    if (isOffline) {
        return (
            <View style={[styles.center, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}>
                <WifiOff size={64} color={Colors.secondary} strokeWidth={1.5} />
                <Text style={{ color: Colors.secondary, fontSize: 22, fontWeight: 'bold', marginTop: 20 }}>{lang === 'ar' ? 'لا يوجد اتصال' : 'No Connection'}</Text>
                <Text style={{ color: theme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 }}>
                    {lang === 'ar' ? 'هذه السورة غير محملة مسبقاً. يرجى الاتصال بالإنترنت لتحميلها.' : 'This surah is not downloaded. Please connect to the internet to load it.'}
                </Text>
                <TouchableOpacity onPress={onBack} style={{ backgroundColor: Colors.secondary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 30 }}>
                    <Text style={{ color: '#081C15', fontWeight: 'bold' }}>{lang === 'ar' ? 'رجوع' : 'Go Back'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}>
            <DetailHeader onBack={onBack} lang={lang} activeColors={theme === 'dark' ? Colors.dark : Colors.light} juz={meta.juz} page={meta.page} surahName={lang === 'ar' ? arabicName : name} topInset={insets.top} />
            <ImageBackground source={require('../../assets/mushaf_bg.png')} style={{ flex: 1 }} imageStyle={{ opacity: theme === 'dark' ? 0.05 : 0.08 }}>
                <FlatList ref={flatListRef} data={pages} keyExtractor={p => p.page} renderItem={({ item }) => (
                    <MushafPage item={item} arabicName={arabicName} number={number} activeColors={theme === 'dark' ? Colors.dark : Colors.light} playingAyah={playingAyah} bookmarks={bookmarks}
                        onAyahPress={a => { setSelectedAyah(a); setModals({ ...modals, options: true }); }} />
                )} onScrollToIndexFailed={i => setTimeout(() => flatListRef.current?.scrollToIndex({ index: i.index, animated: false }), 500)}
                    onViewableItemsChanged={({ viewableItems }) => { if (viewableItems?.[0]) { const item = viewableItems[0].item; setMeta({ page: item.page, juz: item.ayahs[0].j || item.ayahs[0].juz }); Storage.saveLastRead({ number, name, arabicName, ayahNumber: item.ayahs[0].ns }); } }}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }} contentContainerStyle={styles.listContent} />
            </ImageBackground>

            <OptionsSheet visible={modals.options} onClose={() => setModals({ ...modals, options: false })} lang={lang} activeColors={theme === 'dark' ? Colors.dark : Colors.light} arabicName={arabicName} selectedAyah={selectedAyah} onPlay={() => onPlay(selectedAyah)}
                onShowTafsir={() => setModals({ ...modals, options: false, content: true, type: 'tafsir' })} onShowTranslation={() => setModals({ ...modals, options: false, content: true, type: 'translation' })} onToggleBookmark={onBookmark} onShare={() => setModals({ ...modals, options: false, share: true })}
                isBookmarked={bookmarks.some(b => b.surahNumber === number && b.ayahNumber === selectedAyah?.ns)} />

            <ContentModal visible={modals.content} onClose={() => setModals({ ...modals, content: false })} lang={lang} activeColors={theme === 'dark' ? Colors.dark : Colors.light} type={modals.type} selectedAyah={selectedAyah} contentText={getContentText()} />
            <ShareModal visible={modals.share} onClose={() => setModals({ ...modals, share: false })} lang={lang} activeColors={theme === 'dark' ? Colors.dark : Colors.light} selectedAyah={selectedAyah} arabicName={arabicName} viewShotRef={viewShotRef}
                onShareImage={async () => { const uri = await captureRef(viewShotRef, { format: 'png', quality: 1.0 }); Sharing.shareAsync(uri); }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, listContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 50 },
});

export default SurahDetailScreen;
