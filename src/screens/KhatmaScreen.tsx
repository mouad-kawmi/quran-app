import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Modal } from 'react-native';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { CheckCircle2, Trophy, BookOpen, Calendar, Circle, CheckCircle, X } from 'lucide-react-native';
import { JUZ_MAPPING } from '../constants/JuzMapping';

const { width } = Dimensions.get('window');

interface Props {
    onStartReading: (portion: number[]) => void;
    onComplete: () => void;
    currentKhatmaDay: number;
    totalKhatmaDays: number;
    history: string[];
    onSetPlan: (days: number) => void;
    isStarted: boolean;
    lang: string;
    theme: 'dark' | 'light';
}

const KhatmaScreen = ({
    onStartReading,
    onComplete,
    currentKhatmaDay,
    totalKhatmaDays,
    history,
    onSetPlan,
    isStarted,
    lang,
    theme
}: Props) => {
    const t = Translations[lang];
    const [selectedDays, setSelectedDays] = useState(30);
    const [showDua, setShowDua] = useState(false);

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    const isFinished = currentKhatmaDay > totalKhatmaDays;
    const progress = isFinished ? 1 : Math.min((currentKhatmaDay - 1) / totalKhatmaDays, 1);
    const percentage = Math.round(progress * 100);

    const getTodayPortion = () => {
        if (isFinished) return [];
        const juzsPerDay = 30 / totalKhatmaDays;
        const startJuz = Math.floor((currentKhatmaDay - 1) * juzsPerDay) + 1;
        const endJuz = Math.round(currentKhatmaDay * juzsPerDay);

        let juzList = [];
        for (let i = startJuz; i <= endJuz; i++) {
            if (i <= 30) juzList.push(i);
        }
        return juzList;
    };

    const getPortionRangeText = (juzs: number[]) => {
        if (juzs.length === 0) return "";
        const startJuz = juzs[0];
        const endJuz = juzs[juzs.length - 1];

        const startRange = JUZ_MAPPING[startJuz]?.start;
        const endRange = JUZ_MAPPING[endJuz]?.end;

        return `${t.fromSurah} ${startRange} ${t.toSurah} ${endRange}`;
    };

    const todayJuzs = getTodayPortion();
    const isDoneToday = history.includes(new Date().toDateString());

    // Pages per prayer calculation
    const pagesPerDay = (30 / totalKhatmaDays) * 20;
    const pagesPerPrayer = Math.ceil(pagesPerDay / 5);

    if (!isStarted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
                <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                    <Text style={[styles.title, { color: Colors.secondary }]}>{t.khatma}</Text>
                </View>
                <View style={styles.setupContainer}>
                    <Trophy size={60} color={Colors.secondary} style={{ marginBottom: 20 }} />
                    <Text style={[styles.setupText, { color: activeColors.text }]}>
                        {lang === 'ar' ? "كم يوماً تريد ختم القرآن؟" : "In how many days do you want to complete the Quran?"}
                    </Text>
                    <View style={styles.daysRow}>
                        {[3, 7, 10, 30].map(d => (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    styles.dayButton,
                                    { borderColor: activeColors.surfaceLight, backgroundColor: activeColors.surface },
                                    selectedDays === d && { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '15' }
                                ]}
                                onPress={() => setSelectedDays(d)}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    { color: activeColors.text },
                                    selectedDays === d && { color: Colors.secondary }
                                ]}>{d}</Text>
                                <Text style={[
                                    styles.dayLabel,
                                    { color: activeColors.textMuted },
                                    selectedDays === d && { color: Colors.secondary }
                                ]}>{t.day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={[styles.startButton, { backgroundColor: Colors.secondary }]}
                        onPress={() => onSetPlan(selectedDays)}
                    >
                        <Text style={[styles.startButtonText, { color: Colors.dark.background }]}>{t.startReading}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.title, { color: Colors.secondary }]}>
                    {isFinished ? t.mabrouk : `${t.khatma} - ${lang === 'ar' ? 'اليوم' : 'Day'} ${currentKhatmaDay}`}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress Section */}
                <View style={[styles.progressCard, { backgroundColor: activeColors.surface, borderWidth: 1, borderColor: activeColors.surfaceLight }]}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: activeColors.text }]}>{t.progress}</Text>
                        <Text style={[styles.progressPercent, { color: Colors.secondary }]}>{percentage}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: activeColors.surfaceLight }]}>
                        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: Colors.secondary }]} />
                    </View>
                    <Text style={[styles.progressSub, { color: activeColors.textMuted }]}>
                        {lang === 'ar'
                            ? `تبقي ${totalKhatmaDays - Math.min(currentKhatmaDay - 1, totalKhatmaDays)} أيام للختم`
                            : `${totalKhatmaDays - Math.min(currentKhatmaDay - 1, totalKhatmaDays)} days remaining`}
                    </Text>
                </View>

                {isFinished ? (
                    <View style={[styles.portionCard, { backgroundColor: activeColors.surface, padding: 40 }]}>
                        <Trophy size={80} color={Colors.secondary} style={{ marginBottom: 20 }} />
                        <Text style={[styles.portionTitle, { color: Colors.secondary, fontSize: 24 }]}>{t.mabrouk}</Text>
                        <Text style={[styles.congratsText, { color: activeColors.text }]}>
                            {lang === 'ar' ? 'لقد أتممت ختم القرآن الكريم بنجاح!' : 'You have successfully completed the Quran!'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.readButton, { backgroundColor: Colors.secondary, marginTop: 20 }]}
                            onPress={() => setShowDua(true)}
                        >
                            <BookOpen size={20} color={Colors.dark.background} style={{ marginRight: 10 }} />
                            <Text style={[styles.readButtonText, { color: Colors.dark.background }]}>{t.duaKhatmTitle}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => onSetPlan(0)} style={{ marginTop: 30 }}>
                            <Text style={[styles.resetText, { color: activeColors.textMuted }]}>{lang === 'ar' ? 'بدء ختمة جديدة' : 'Start New Khatma'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.portionCard, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.portionHeader}>
                            <View>
                                <Text style={[styles.portionTitle, { color: Colors.secondary, textAlign: lang === 'ar' ? 'right' : 'left' }]}>{lang === 'ar' ? 'ورد اليوم' : 'Portion of the Day'}</Text>
                                <Text style={[styles.rangeText, { color: activeColors.text, textAlign: lang === 'ar' ? 'right' : 'left' }]}>
                                    {getPortionRangeText(todayJuzs)}
                                </Text>
                            </View>
                            {isDoneToday && <CheckCircle2 size={30} color="#4CAF50" />}
                        </View>

                        <View style={styles.juzBadgeContainer}>
                            {todayJuzs.map(j => (
                                <View key={j} style={[styles.juzBadge, { borderColor: Colors.secondary, backgroundColor: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.05)' }]}>
                                    <Text style={[styles.juzBadgeText, { color: activeColors.text }]}>{t.juz} {j}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.totalPagesText, { color: Colors.secondary }]}>
                            {t.totalPages.replace('{count}', Math.round(pagesPerDay).toString())}
                        </Text>

                        <Text style={[styles.infoText, { color: activeColors.textMuted }]}>
                            {t.todayJuzCount.replace('{count}', todayJuzs.length.toString())}
                        </Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.readBtnSmall, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
                                onPress={() => onStartReading(todayJuzs)}
                            >
                                <BookOpen size={20} color={Colors.secondary} />
                                <Text style={[styles.readBtnSmallText, { color: activeColors.text }]}>{t.startReading}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.doneBtn, { backgroundColor: isDoneToday ? '#4CAF50' : Colors.secondary }]}
                                onPress={() => !isDoneToday && onComplete()}
                                disabled={isDoneToday}
                            >
                                {isDoneToday ? <CheckCircle size={20} color="white" /> : <Circle size={20} color={Colors.dark.background} />}
                                <Text style={[styles.doneBtnText, { color: isDoneToday ? 'white' : Colors.dark.background }]}>
                                    {isDoneToday ? t.completePortion : t.markAsDone}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 }} />
                            <Text style={{ fontSize: 11, color: activeColors.textMuted }}>
                                {lang === 'ar' ? 'متاح بدون إنترنت' : 'Available Offline'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Prayer Breakdown Section */}
                {!isFinished && (
                    <View style={[styles.prayerBreakdownCard, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.historyHeader}>
                            <BookOpen size={18} color={Colors.secondary} />
                            <Text style={[styles.historyTitle, { color: activeColors.text }]}>
                                {t.prayerBreakdown}
                            </Text>
                        </View>

                        <View style={styles.prayerGrid}>
                            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p, i) => (
                                <View key={p} style={[styles.prayerPageItem, { borderBottomWidth: i === 4 ? 0 : 1, borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                    <Text style={[styles.prayerName, { color: activeColors.text }]}>{t[p]}</Text>
                                    <View style={styles.pageCountBox}>
                                        <Text style={[styles.pageValue, { color: Colors.secondary }]}>{pagesPerPrayer}</Text>
                                        <Text style={[styles.pageUnit, { color: activeColors.textMuted }]}> {t.pages}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.infoText, { color: activeColors.textMuted, marginTop: 15, textAlign: 'center' }]}>
                            {t.pagesAfterPrayer.replace('{pages}', pagesPerPrayer.toString())}
                        </Text>
                    </View>
                )}

                {/* History Streaks */}
                {isStarted && !isFinished && (
                    <View style={[styles.historyCard, { backgroundColor: activeColors.surface }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <Calendar size={18} color={Colors.secondary} />
                            <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10, color: activeColors.text }}>
                                {lang === 'ar' ? 'سجل الالتزام' : 'Streak History'}
                            </Text>
                        </View>
                        <View style={styles.streakRow}>
                            {Array.from({ length: 7 }).map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (6 - i));
                                const dateStr = date.toDateString();
                                const isDone = history.includes(dateStr);
                                const dayName = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'narrow' });

                                return (
                                    <View key={i} style={styles.streakItem}>
                                        <View style={[
                                            styles.streakCircle,
                                            { backgroundColor: isDark ? '#222' : '#f9f9f9', borderColor: isDark ? '#444' : '#ddd' },
                                            isDone && { backgroundColor: Colors.secondary, borderColor: Colors.secondary }
                                        ]}>
                                            {isDone && <CheckCircle size={14} color={Colors.dark.background} />}
                                        </View>
                                        <Text style={[styles.streakDay, { color: activeColors.textMuted }]}>{dayName}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {!isFinished && (
                    <TouchableOpacity onPress={() => onSetPlan(0)} style={{ marginTop: 40, marginBottom: 20 }}>
                        <Text style={[styles.resetText, { color: '#ff4444' }]}>{lang === 'ar' ? 'إلغاء خطة الختمة' : 'Cancel Khatma Plan'}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* DUA MODAL */}
            <Modal visible={showDua} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.secondary }]}>{t.duaKhatmTitle}</Text>
                            <TouchableOpacity onPress={() => setShowDua(false)}>
                                <X size={24} color={activeColors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.duaScroll}>
                            <Text style={[styles.duaText, { color: activeColors.text }]}>{t.duaKhatmBody}</Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.closeModalBtn, { backgroundColor: Colors.secondary }]}
                            onPress={() => setShowDua(false)}
                        >
                            <Text style={{ color: Colors.dark.background, fontWeight: 'bold' }}>{lang === 'ar' ? 'أغلق' : 'Close'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold' },
    setupContainer: { flex: 1, justifyContent: 'center', padding: 30, alignItems: 'center' },
    setupText: { fontSize: 20, marginBottom: 40, textAlign: 'center', fontWeight: '600' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 50 },
    dayButton: { width: width * 0.18, height: width * 0.18, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    dayButtonText: { fontSize: 22, fontWeight: 'bold' },
    dayLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    startButton: { paddingVertical: 18, paddingHorizontal: 60, borderRadius: 20, elevation: 5, shadowColor: Colors.secondary, shadowOpacity: 0.3, shadowRadius: 10 },
    startButtonText: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    progressCard: { padding: 20, borderRadius: 25, marginBottom: 20 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    progressLabel: { fontSize: 14, fontWeight: '600' },
    progressPercent: { fontSize: 18, fontWeight: 'bold' },
    progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
    progressBarFill: { height: '100%', borderRadius: 5 },
    progressSub: { fontSize: 12 },
    portionCard: { padding: 20, borderRadius: 25, shadowColor: '#000', shadowOpacity: 0.1, elevation: 3, marginBottom: 20 },
    portionHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
    portionTitle: { fontSize: 20, fontWeight: 'bold' },
    rangeText: { fontSize: 15, fontWeight: '500', marginTop: 4, lineHeight: 22 },
    juzBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, marginTop: 10 },
    juzBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1 },
    juzBadgeText: { fontSize: 14, fontWeight: 'bold' },
    totalPagesText: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    infoText: { marginBottom: 25, fontSize: 13 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    readBtnSmall: { flex: 0.45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 15 },
    readBtnSmallText: { marginLeft: 8, fontWeight: 'bold' },
    doneBtn: { flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 15 },
    doneBtnText: { marginLeft: 8, fontWeight: 'bold' },
    historyCard: { padding: 20, borderRadius: 25 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    historyTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    streakRow: { flexDirection: 'row', justifyContent: 'space-between' },
    streakItem: { alignItems: 'center' },
    streakCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    streakDay: { fontSize: 12, fontWeight: '600' },
    resetText: { textAlign: 'center', fontWeight: 'bold' },
    congratsText: { textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 20 },
    readButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 15, width: '100%' },
    readButtonText: { fontSize: 16, fontWeight: 'bold' },
    prayerBreakdownCard: { padding: 20, borderRadius: 25, marginBottom: 20 },
    prayerGrid: { marginTop: 10 },
    prayerPageItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, alignItems: 'center' },
    prayerName: { fontSize: 16, fontWeight: '600' },
    pageCountBox: { flexDirection: 'row', alignItems: 'center' },
    pageValue: { fontSize: 18, fontWeight: 'bold' },
    pageUnit: { fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 30, padding: 25, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', flex: 1 },
    duaScroll: { marginBottom: 20 },
    duaText: { fontSize: 18, lineHeight: 32, textAlign: 'center' },
    closeModalBtn: { paddingVertical: 15, borderRadius: 15, alignItems: 'center' }
});

export default KhatmaScreen;
