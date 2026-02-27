import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Platform, StatusBar } from 'react-native';
// REMOVED Location import to prevent popups
import axios from 'axios';
import { Storage } from '../utils/storage';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { NotificationService } from '../utils/notificationService';
import { MapPin, Clock } from 'lucide-react-native';

interface Props {
    lang: string;
    theme: 'dark' | 'light';
}

const PrayerScreen = ({ lang, theme }: Props) => {
    const t = Translations[lang];
    // Default to Casablanca as requested
    const DEFAULT_LOCATION = { latitude: 33.5731, longitude: -7.5898, city: lang === 'ar' ? 'الدار البيضاء' : 'Casablanca' };

    const [city, setCity] = useState(DEFAULT_LOCATION.city);
    const [timings, setTimings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activePrayer, setActivePrayer] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [status, setStatus] = useState<'upcoming' | 'passed'>('upcoming');

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. First, check if we have something in cache
                const cached = await Storage.getPrayerTimes();
                let lat = DEFAULT_LOCATION.latitude;
                let lon = DEFAULT_LOCATION.longitude;
                let currentCity = DEFAULT_LOCATION.city;

                if (cached) {
                    setTimings(cached.times);
                    if (cached.city) {
                        setCity(cached.city);
                        currentCity = cached.city;
                    }

                    // If cache is from today, show it immediately and we're done with "loading"
                    if (cached.date === new Date().toDateString()) {
                        setLoading(false);
                    }
                }

                // 2. Fetch fresh data based on the city (Last used or Casablanca)
                // We DON'T use Location detection here to avoid popups
                await fetchPrayerTimes(lat, lon, currentCity);

            } catch (e) {
                console.error("Prayer load error:", e);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (timings) {
            calculateNextPrayer();
            const timer = setInterval(() => {
                calculateNextPrayer();
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timings]);

    const fetchPrayerTimes = async (lat: number, lon: number, cityName: string) => {
        try {
            // Using a fixed method (21 = French method often used in Morocco, or 3 for general)
            const response = await axios.get(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=21`);
            const data = response.data.data.timings;

            setTimings(data);
            await Storage.savePrayerTimes(data, cityName);
            await NotificationService.scheduleAll(lang as any, data);
        } catch (error) {
            console.error('Prayer API failed:', error);
            // If API fails, we still have the cache from loadInitialData
        }
    };

    const calculateNextPrayer = () => {
        if (!timings) return;
        const now = new Date();
        const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        // 1. Check if we are within 30 mins AFTER a prayer
        for (let i = prayerKeys.length - 1; i >= 0; i--) {
            const key = prayerKeys[i];
            const [hours, minutes] = timings[key].split(':').map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0);

            const thirtyMinsAfter = new Date(prayerDate.getTime() + 30 * 60 * 1000);

            if (now >= prayerDate && now <= thirtyMinsAfter) {
                setActivePrayer({ name: key, time: timings[key] });
                const diff = now.getTime() - prayerDate.getTime();
                setTimeLeft(formatPassed(diff));
                setStatus('passed');
                return;
            }
        }

        // 2. Otherwise find the upcoming prayer
        let found = false;
        for (let key of prayerKeys) {
            const [hours, minutes] = timings[key].split(':').map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0);

            if (prayerDate > now) {
                setActivePrayer({ name: key, time: timings[key] });
                const diff = prayerDate.getTime() - now.getTime();
                setTimeLeft(formatDiff(diff));
                setStatus('upcoming');
                found = true;
                break;
            }
        }

        if (!found) {
            const key = 'Fajr';
            setActivePrayer({ name: key, time: timings[key] });
            const [hours, minutes] = timings[key].split(':').map(Number);
            const tomorrowFajr = new Date();
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            tomorrowFajr.setHours(hours, minutes, 0);
            const diff = tomorrowFajr.getTime() - now.getTime();
            setTimeLeft(formatDiff(diff));
            setStatus('upcoming');
        }
    };

    const formatDiff = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatPassed = (ms: number) => {
        const minutes = Math.floor(ms / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading && !timings) {
        return (
            <View style={[styles.center, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
                <Text style={{ marginTop: 15, color: activeColors.textMuted }}>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.title, { color: Colors.secondary }]}>{t.prayer}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activePrayer && (
                    <View style={[styles.timerCard, { backgroundColor: activeColors.surface, borderColor: status === 'passed' ? activeColors.text : Colors.secondary }]}>
                        <View style={[styles.statusBadge, { backgroundColor: status === 'passed' ? '#4CAF50' : 'rgba(212, 175, 55, 0.1)' }]}>
                            <Text style={[styles.statusText, { color: status === 'passed' ? '#fff' : Colors.secondary }]}>
                                {status === 'passed'
                                    ? (lang === 'ar' ? 'حان وقت الصلاة' : 'Prayer Time')
                                    : (lang === 'ar' ? 'الصلاة القادمة' : 'Next Prayer')}
                            </Text>
                        </View>

                        <Text style={[styles.activePrayerName, { color: activeColors.text }]}>
                            {t[activePrayer.name] || activePrayer.name}
                        </Text>

                        <Text style={[styles.timerValue, { color: status === 'passed' ? '#4CAF50' : Colors.secondary }]}>{timeLeft}</Text>

                        <Text style={[styles.timerInfo, { color: activeColors.textMuted }]}>
                            {status === 'passed'
                                ? (lang === 'ar' ? 'بدأ الأذان منذ: ' : 'Adhan started: ')
                                : (lang === 'ar' ? 'على الساعة: ' : 'At: ')}
                            {activePrayer.time}
                        </Text>
                    </View>
                )}

                <View style={styles.prayerListContainer}>
                    <View style={styles.listHeader}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <MapPin size={20} color={Colors.secondary} />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={[styles.sectionTitle, { color: activeColors.text }]}>{t.prayerBreakdown || t.prayer}</Text>
                                <Text style={[styles.cityText, { color: activeColors.textMuted, fontSize: 13 }]}>{city}</Text>
                            </View>
                        </View>
                    </View>

                    {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
                        const isNext = activePrayer?.name === name && status === 'upcoming';
                        const isCurrent = activePrayer?.name === name && status === 'passed';

                        return (
                            <View key={name} style={[
                                styles.prayerCard,
                                { backgroundColor: activeColors.surface },
                                (isNext || isCurrent) && { borderColor: Colors.secondary, borderWidth: 1.5, shadowColor: Colors.secondary, shadowOpacity: 0.1, elevation: 4 }
                            ]}>
                                <View style={styles.prayerInfoLeft}>
                                    <Text style={[styles.prayerName, { color: activeColors.text }, (isNext || isCurrent) && { color: Colors.secondary }]}>
                                        {t[name] || (name === 'Sunrise' ? (lang === 'ar' ? 'الشروق' : 'Sunrise') : name)}
                                    </Text>
                                    {(isNext || isCurrent) && (
                                        <View style={[styles.nowBadge, { backgroundColor: isCurrent ? '#4CAF50' : Colors.secondary }]}>
                                            <Text style={styles.nowText}>{isCurrent ? (lang === 'ar' ? 'الآن' : 'Now') : (lang === 'ar' ? 'التالية' : 'Next')}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.prayerTime, { color: activeColors.text }]}>{timings?.[name]}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.footerSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingVertical: 18, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    cityText: { fontWeight: '500' },
    timerCard: {
        paddingVertical: 35,
        paddingHorizontal: 20,
        borderRadius: 35,
        marginBottom: 35,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 15,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    activePrayerName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    timerValue: {
        fontSize: 64,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    timerInfo: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 5,
    },

    prayerListContainer: { marginBottom: 30 },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingLeft: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },

    prayerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 22,
        borderRadius: 22,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    prayerInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prayerName: {
        fontSize: 18,
        fontWeight: '600'
    },
    nowBadge: {
        marginLeft: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    nowText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    prayerTime: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footerSpacing: { height: 40 },
});

export default PrayerScreen;
