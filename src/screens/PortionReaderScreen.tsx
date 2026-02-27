import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, ImageBackground, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import axios from 'axios';
import { Storage } from '../utils/storage';
import { Colors } from '../constants/Colors';
import { CheckCircle, WifiOff } from 'lucide-react-native';

// Components
import OptionsSheet from '../components/quran/OptionsSheet';
import ContentModal from '../components/quran/ContentModal';
import ShareModal from '../components/quran/ShareModal';
import DetailHeader from '../components/quran/DetailHeader';
import MushafPage from '../components/quran/MushafPage';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const PortionReaderScreen = ({ juzList, onComplete, onBack, lang, theme, reciter }: any) => {
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState<any[]>([]);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 0, juz: juzList[0], surah: '' });
    const [modals, setModals] = useState({ options: false, content: false, share: false, type: 'translation' as any });
    const [editions, setEditions] = useState<any[]>([]);
    const [selectedAyah, setSelectedAyah] = useState<any>(null);
    const [isDiskFull, setIsDiskFull] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const flatListRef = useRef<any>(null);
    const soundRef = useRef<any>(null);
    const viewShotRef = useRef<any>(null);
    const insets = useSafeAreaInsets();
    const activeColors = theme === 'dark' ? Colors.dark : Colors.light;

    useEffect(() => {
        const load = async () => {
            if (!juzList || juzList.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true); setIsDiskFull(false); setIsOffline(false);
            const juzNum = juzList[0];
            const b = await Storage.getBookmarks(); setBookmarks(b);

            try {
                let data = await Storage.getJuzCache(juzNum);
                if (!data || !Array.isArray(data) || !data[0]?.a) {
                    const res = await axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/quran-uthmani`, { timeout: 10000 });
                    if (!res.data?.data?.ayahs) throw new Error("Invalid API response");

                    data = [{
                        e: { id: 'uthmani' },
                        a: res.data.data.ayahs.map((a: any) => ({
                            n: a.number,
                            ns: a.numberInSurah,
                            t: a.text,
                            p: a.page,
                            j: a.juz,
                            s: { n: a.surah.number, sn: a.surah.name }
                        }))
                    }];
                    await Storage.saveJuzCache(juzNum, data);
                }

                const uthmani = data[0]?.a;
                if (!uthmani || !Array.isArray(uthmani)) throw new Error("Corrupt data");

                setEditions(data);
                const firstAyah = uthmani[0];
                setMeta({ page: firstAyah.p, juz: firstAyah.j, surah: firstAyah.s?.sn || '' });

                const groups = uthmani.reduce((acc: any, a: any) => {
                    const page = a.p || 0;
                    acc[page] = acc[page] || [];
                    acc[page].push(a);
                    return acc;
                }, {});

                const pList = Object.keys(groups)
                    .sort((a, b) => Number(a) - Number(b))
                    .map(p => ({ page: Number(p), ayahs: groups[p] }));

                setPages(pList);
            } catch (e: any) {
                console.log("Khatma Load Error:", e);
                if (e.message?.includes('full')) setIsDiskFull(true);
                else setIsOffline(true);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
    }, [juzList?.join(',')]);

    const onPlay = async (ayah: any) => {
        try {
            if (soundRef.current) await soundRef.current.unloadAsync();
            if (playingAyah === ayah.n) return setPlayingAyah(null);
            setPlayingAyah(ayah.n);
            const url = `https://everyayah.com/data/${reciter}/${ayah.s.n.toString().padStart(3, '0')}${ayah.ns.toString().padStart(3, '0')}.mp3`;
            const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }, (s: any) => {
                if (s.didJustFinish) {
                    const uthmani = editions[0].a;
                    const idx = uthmani.findIndex((a: any) => a.n === ayah.n);
                    if (idx !== -1 && idx < uthmani.length - 1) onPlay(uthmani[idx + 1]);
                    else setPlayingAyah(null);
                }
            });
            soundRef.current = sound; setModals({ ...modals, options: false });
        } catch (e) { setPlayingAyah(null); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.secondary} /></View>;
    if (isDiskFull) return <View style={styles.center}><WifiOff size={50} color={activeColors.textMuted} /><Text style={{ color: activeColors.text }}>Storage Full</Text></View>;
    if (isOffline) return (
        <View style={[styles.center, { backgroundColor: activeColors.background }]}>
            <WifiOff size={50} color={activeColors.textMuted} />
            <Text style={{ color: activeColors.text, marginVertical: 20 }}>{lang === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.secondary }]} onPress={() => onBack()}>
                <Text style={styles.btnText}>{lang === 'ar' ? 'رجوع' : 'Go Back'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <DetailHeader onBack={onBack} lang={lang} activeColors={activeColors} juz={meta.juz} page={meta.page} surahName={meta.surah} topInset={insets.top} />
            <ImageBackground source={require('../../assets/mushaf_bg.png')} style={{ flex: 1 }} imageStyle={{ opacity: theme === 'dark' ? 0.05 : 0.08 }}>
                <FlatList ref={flatListRef} data={pages} keyExtractor={p => p.page} renderItem={({ item }) => (
                    <MushafPage item={item} arabicName={item.ayahs[0].s.sn} number={item.ayahs[0].s.n} activeColors={activeColors} playingAyah={playingAyah} bookmarks={bookmarks}
                        onAyahPress={a => { setSelectedAyah(a); setModals({ ...modals, options: true }); }} />
                )} ListFooterComponent={() => (
                    <View style={styles.footer}>
                        <CheckCircle size={50} color={Colors.secondary} />
                        <Text style={[styles.footerTitle, { color: activeColors.text }]}>{lang === 'ar' ? 'تقبل الله منك!' : 'Taqabbala Allah!'}</Text>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.secondary }]} onPress={onComplete}><Text style={styles.btnText}>{lang === 'ar' ? 'إنهاء الورد' : 'Finish'}</Text></TouchableOpacity>
                    </View>
                )} contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 100 }}
                    onViewableItemsChanged={({ viewableItems }) => { if (viewableItems?.[0]) { const item = viewableItems[0].item; setMeta({ page: item.page, juz: item.ayahs[0].j, surah: item.ayahs[0].s.sn }); } }} />
            </ImageBackground>

            <OptionsSheet visible={modals.options} onClose={() => setModals({ ...modals, options: false })} lang={lang} activeColors={activeColors} arabicName={selectedAyah?.s?.sn || ''} selectedAyah={selectedAyah} onPlay={() => onPlay(selectedAyah)}
                onShowTafsir={() => setModals({ ...modals, options: false, content: true, type: 'tafsir' })} onShowTranslation={() => setModals({ ...modals, options: false, content: true, type: 'translation' })} onToggleBookmark={async () => { }} onShare={() => setModals({ ...modals, options: false, share: true })}
                isBookmarked={bookmarks.some(b => b.surahNumber === selectedAyah?.s?.n && b.ayahNumber === selectedAyah?.ns)} />

            <ContentModal visible={modals.content} onClose={() => setModals({ ...modals, content: false })} lang={lang} activeColors={activeColors} type={modals.type} selectedAyah={selectedAyah} contentText={""} />
            <ShareModal visible={modals.share} onClose={() => setModals({ ...modals, share: false })} lang={lang} activeColors={activeColors} selectedAyah={selectedAyah} arabicName={selectedAyah?.s?.sn || ''} viewShotRef={viewShotRef}
                onShareImage={async () => { const uri = await captureRef(viewShotRef, { format: 'png', quality: 1.0 }); Sharing.shareAsync(uri); }} />
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    footer: { alignItems: 'center', paddingVertical: 40 }, footerTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 15 },
    btn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 }, btnText: { fontWeight: 'bold', fontSize: 16 }
});

export default PortionReaderScreen;
