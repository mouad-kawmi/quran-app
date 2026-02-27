import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, Alert, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { Storage } from '../utils/storage';
import { Trash2, X, CheckCircle, Download, Sun, BookOpen, Clock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import SettingItem from '../components/settings/SettingItem';
import { Audio } from 'expo-av';

const RECITERS = [
    { id: 'Alafasy_128kbps', nameAr: 'مشاري العفاسي', nameEn: 'Mishary Al-Afasy' },
    { id: 'MaherAlMuaiqly128kbps', nameAr: 'ماهر المعيقلي', nameEn: 'Maher Al-Muaiqly' },
    { id: 'Abdurrahmaan_As-Sudais_192kbps', nameAr: 'عبد الرحمن السديس', nameEn: 'Abdur-Rahman As-Sudais' },
    { id: 'Yasser_Ad-Dussary_128kbps', nameAr: 'ياسر الدوسري', nameEn: 'Yasser Al-Dosari' },
    { id: 'Minshawy_Murattal_128kbps', nameAr: 'محمد صديق المنشاوي', nameEn: 'Muhammad Al-Minshawi' },
    { id: 'Abdul_Basit_Murattal_192kbps', nameAr: 'عبد الباسط عبد الصمد', nameEn: 'Abdelbasset Abdessamad' }
];

const SettingsScreen = ({ lang, theme, onToggleLang, onToggleTheme, reciter, setReciter }: any) => {
    const t = Translations[lang];
    const activeColors = theme === 'dark' ? Colors.dark : Colors.light;
    const [sync, setSync] = useState({ loading: false, prog: 0, done: false });
    const [modal, setModal] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        Storage.isFullSynced().then(v => setSync({ ...sync, done: v }));
        return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
    }, []);

    const previewVoice = async (id: string) => {
        try {
            if (soundRef.current) await soundRef.current.unloadAsync();
            const url = `https://everyayah.com/data/${id}/001001.mp3`; // Play Bismillah as preview
            const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
            soundRef.current = sound;
        } catch (e) { console.log("Preview failed", e); }
    };

    const onDownload = async () => {
        setSync({ ...sync, loading: true });
        try {
            for (let i = 1; i <= 30; i++) {
                const res = await axios.get(`https://api.alquran.cloud/v1/juz/${i}/quran-uthmani`);
                // Unified format: matches PortionReaderScreen expectation
                const formattedJuz = [{
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
                await Storage.saveJuzCache(i, formattedJuz);
                setSync(s => ({ ...s, prog: Math.round((i / 30) * 100) }));
            }
            await Storage.setFullSync(true); setSync({ ...sync, done: true, loading: false });
        } catch (e) { setSync({ ...sync, loading: false }); }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}><Text style={[styles.title, { color: Colors.secondary }]}>{t.settings}</Text></View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <SettingItem label={t.language} value={lang === 'ar' ? 'العربية' : 'English'} onPress={onToggleLang} activeColors={activeColors} />
                <SettingItem label={lang === 'ar' ? 'المظهر الليلي' : 'Dark Mode'} activeColors={activeColors}>
                    <Switch value={theme === 'dark'} onValueChange={onToggleTheme} trackColor={{ true: Colors.secondary }} />
                </SettingItem>
                <SettingItem label={lang === 'ar' ? 'القارئ' : 'Reciter'} value={RECITERS.find(r => r.id === reciter)?.[lang === 'ar' ? 'nameAr' : 'nameEn']} onPress={() => setModal(true)} activeColors={activeColors} />

                <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: sync.done ? '#4CAF50' : activeColors.border }]}>
                    <Text style={[styles.cardTitle, { color: activeColors.text }]}>{lang === 'ar' ? 'تحميل كامل' : 'Full Download'}</Text>
                    {sync.loading ? <Text>{sync.prog}%</Text> : (sync.done ? <CheckCircle color="#4CAF50" /> : <TouchableOpacity onPress={onDownload}><Download color={Colors.secondary} /></TouchableOpacity>)}
                </View>

                <TouchableOpacity onPress={async () => { await Storage.resetEverything(); Alert.alert("Reset Done"); }} style={styles.dangerBtn}>
                    <Trash2 size={20} color="#fff" /><Text style={styles.dangerText}>{lang === 'ar' ? 'مسح البيانات' : 'Reset Everything'}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={modal} transparent animationType="slide">
                <View style={styles.modal}><View style={[styles.modalContent, { backgroundColor: activeColors.background }]}>
                    <View style={styles.modalHeader}><Text style={{ color: activeColors.text }}>{lang === 'ar' ? 'اختر القارئ' : 'Select Reciter'}</Text><TouchableOpacity onPress={() => setModal(false)}><X color={activeColors.text} /></TouchableOpacity></View>
                    {RECITERS.map(r => (
                        <TouchableOpacity
                            key={r.id}
                            onPress={() => {
                                setReciter(r.id);
                                Storage.saveReciter(r.id);
                                previewVoice(r.id);
                                setModal(false);
                            }}
                            style={[styles.recItem, reciter === r.id && { backgroundColor: Colors.secondary + '20' }]}
                        >
                            <Text style={{ color: activeColors.text, fontWeight: reciter === r.id ? 'bold' : 'normal' }}>
                                {lang === 'ar' ? r.nameAr : r.nameEn}
                            </Text>
                            {reciter === r.id && <CheckCircle size={18} color={Colors.secondary} />}
                        </TouchableOpacity>
                    ))}
                </View></View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 }, header: { padding: 20, alignItems: 'center' }, title: { fontSize: 20, fontWeight: 'bold' },
    card: { padding: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderWidth: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    dangerBtn: { flexDirection: 'row', backgroundColor: '#ff4444', padding: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    dangerText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
    modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 25, padding: 20 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    recItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});

export default SettingsScreen;
