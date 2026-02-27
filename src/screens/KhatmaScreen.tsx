import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal } from 'react-native';
import { BookOpen, X } from 'lucide-react-native';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { JUZ_MAPPING } from '../constants/JuzMapping';

// Components
import KhatmaSetup from '../components/khatma/KhatmaSetup';
import KhatmaProgress from '../components/khatma/KhatmaProgress';
import PrayerBreakdown from '../components/khatma/PrayerBreakdown';

const KhatmaScreen = ({ onStartReading, onComplete, currentKhatmaDay: day, totalKhatmaDays: total, history, onSetPlan, isStarted, lang, theme }: any) => {
    const t = Translations[lang];
    const activeColors = theme === 'dark' ? Colors.dark : Colors.light;
    const [showDua, setShowDua] = useState(false);

    if (!isStarted) return <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.background }}><KhatmaSetup onSetPlan={onSetPlan} lang={lang} t={t} activeColors={activeColors} /></SafeAreaView>;

    const finished = day > total;
    const perc = finished ? 100 : Math.round(((day - 1) / total) * 100);
    const juzsPerD = 30 / total;
    const todayJuzs = Array.from({ length: Math.round(day * juzsPerD) - Math.floor((day - 1) * juzsPerD) }, (_, i) => Math.floor((day - 1) * juzsPerD) + 1 + i).filter(j => j <= 30);
    const range = todayJuzs.length ? `${t.juz} ${todayJuzs.join(' & ')} (${JUZ_MAPPING[todayJuzs[0]]?.start} - ${JUZ_MAPPING[todayJuzs[todayJuzs.length - 1]]?.end})` : "";
    const isDone = history.includes(new Date().toDateString());

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.title, { color: Colors.secondary }]}>{finished ? t.mabrouk : `${t.khatma} - ${lang === 'ar' ? 'اليوم' : 'Day'} ${day}`}</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <KhatmaProgress percentage={perc} remainingDays={total - Math.min(day - 1, total)} lang={lang} t={t} activeColors={activeColors} />

                <View style={[styles.card, { backgroundColor: activeColors.surface }]}>
                    <Text style={[styles.cardTitle, { color: Colors.secondary }]}>{t.dailyPortion}</Text>
                    <Text style={[styles.range, { color: activeColors.text }]}>{range}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: Colors.secondary }]} onPress={() => onStartReading(todayJuzs)}>
                            <BookOpen size={20} color="#000" />
                            <Text style={styles.btnText}>{t.startReading}</Text>
                        </TouchableOpacity>
                        {!isDone && (
                            <TouchableOpacity style={[styles.doneBtn, { borderColor: Colors.secondary }]} onPress={onComplete}>
                                <Text style={{ color: Colors.secondary, fontWeight: 'bold' }}>{t.markAsDone}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {!finished && <PrayerBreakdown juzsCount={juzsPerD} lang={lang} t={t} activeColors={activeColors} />}

                <TouchableOpacity style={[styles.card, { backgroundColor: activeColors.surface, alignItems: 'center' }]} onPress={() => setShowDua(true)}>
                    <Text style={{ color: Colors.secondary, fontWeight: 'bold' }}>{t.duaKhatmTitle} ✨</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => onSetPlan(0)} style={{ marginTop: 10, marginBottom: 30 }}><Text style={{ textAlign: 'center', color: '#ff4444', fontSize: 12 }}>{lang === 'ar' ? 'إلغاء الخطة الحالية' : 'Cancel Current Plan'}</Text></TouchableOpacity>
            </ScrollView>

            <Modal visible={showDua} transparent animationType="fade">
                <View style={styles.modal}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.background }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={[styles.cardTitle, { color: Colors.secondary }]}>{t.duaKhatmTitle}</Text>
                            <TouchableOpacity onPress={() => setShowDua(false)}><X color={activeColors.text} /></TouchableOpacity>
                        </View>
                        <ScrollView><Text style={[styles.dua, { color: activeColors.text }]}>{t.duaKhatmBody}</Text></ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 }, header: { padding: 20, alignItems: 'center' }, title: { fontSize: 20, fontWeight: 'bold' },
    card: { padding: 20, borderRadius: 25, marginBottom: 20 }, cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    range: { fontSize: 14, marginBottom: 20 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15 },
    doneBtn: { padding: 15, borderRadius: 15, borderWidth: 1, marginLeft: 10, minWidth: 100, alignItems: 'center' },
    btnText: { marginLeft: 10, fontWeight: 'bold' },
    modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 25 },
    modalContent: { borderRadius: 30, padding: 25, maxHeight: '80%' },
    dua: { fontSize: 18, textAlign: 'center', lineHeight: 32 }
});

export default KhatmaScreen;
