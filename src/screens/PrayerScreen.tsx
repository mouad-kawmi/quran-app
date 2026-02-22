import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Animated, Easing } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { Storage } from '../utils/storage';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { NotificationService } from '../utils/notificationService';
import { Compass, Navigation, MapPin } from 'lucide-react-native';

interface Props {
    lang: string;
    theme: 'dark' | 'light';
}

const PrayerScreen = ({ lang, theme }: Props) => {
    const t = Translations[lang];
    const [timings, setTimings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qiblaFixed, setQiblaFixed] = useState(0);
    const [nextPrayer, setNextPrayer] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [heading, setHeading] = useState(0);
    const animatedHeading = useRef(new Animated.Value(0)).current;

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        let headingSubscription: any = null;

        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLoading(false);
                    return;
                }

                let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const { latitude, longitude } = loc.coords;

                await fetchPrayerTimes(latitude, longitude);
                calculateQibla(latitude, longitude);

                headingSubscription = await Location.watchHeadingAsync((data) => {
                    const currentHeading = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;

                    // Smooth rotation using Animated
                    Animated.timing(animatedHeading, {
                        toValue: currentHeading,
                        duration: 150,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }).start();

                    setHeading(currentHeading);
                });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            if (headingSubscription) headingSubscription.remove();
        };
    }, []);

    useEffect(() => {
        if (timings) {
            const timer = setInterval(() => {
                calculateNextPrayer();
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timings]);


    const fetchPrayerTimes = async (lat: number, lon: number) => {
        try {
            const response = await axios.get(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=21&tune=0,-2,-2,-1,-1,-1,0,-1,0`);
            const data = response.data.data.timings;
            setTimings(data);
            await Storage.savePrayerTimes(data);
            await NotificationService.scheduleAll(lang as any, data);
        } catch (error) {
            console.error('Prayer API failed, trying cache:', error);
            const cached = await Storage.getPrayerTimes();
            if (cached) {
                setTimings(cached.times);
                await NotificationService.scheduleAll(lang as any, cached.times);
            }
        }
    };


    const calculateQibla = (lat: number, lon: number) => {
        const lat1 = lat * Math.PI / 180;
        const lng1 = lon * Math.PI / 180;
        const lat2 = 21.4225 * Math.PI / 180;
        const lng2 = 39.8262 * Math.PI / 180;

        const y = Math.sin(lng2 - lng1);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        setQiblaFixed((bearing + 360) % 360);
    };

    const calculateNextPrayer = () => {
        if (!timings) return;
        const now = new Date();
        const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        let found = false;

        for (let key of prayerKeys) {
            const [hours, minutes] = timings[key].split(':').map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0);

            if (prayerDate > now) {
                setNextPrayer({ name: key, time: timings[key] });
                const diff = prayerDate.getTime() - now.getTime();
                setTimeLeft(formatDiff(diff));
                found = true;
                break;
            }
        }

        if (!found) {
            setNextPrayer({ name: 'Fajr', time: timings.Fajr });
            const [hours, minutes] = timings.Fajr.split(':').map(Number);
            const tomorrowFajr = new Date();
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            tomorrowFajr.setHours(hours, minutes, 0);
            const diff = tomorrowFajr.getTime() - now.getTime();
            setTimeLeft(formatDiff(diff));
        }
    };

    const formatDiff = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const needleRotation = (qiblaFixed - heading + 360) % 360;
    const isAligned = needleRotation > 355 || needleRotation < 5;

    // Derived animation values
    const rotateCompass = animatedHeading.interpolate({
        inputRange: [0, 360],
        outputRange: ['360deg', '0deg']
    });

    const rotateNeedle = animatedHeading.interpolate({
        inputRange: [0, 360],
        outputRange: [`${qiblaFixed}deg`, `${qiblaFixed - 360}deg`]
    });

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
                <Text style={{ color: Colors.secondary, marginTop: 10 }}>{lang === 'ar' ? 'البحث عن القبلة...' : 'Finding Qibla...'}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.title, { color: Colors.secondary }]}>{t.prayer}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {nextPrayer && (
                    <View style={[styles.timerCard, { backgroundColor: activeColors.surface, borderColor: Colors.secondary }]}>
                        <Text style={[styles.timerSub, { color: activeColors.textMuted }]}>
                            {lang === 'ar' ? 'الصلاة القادمة: ' : 'Next Prayer: '}
                            {t[nextPrayer.name] || nextPrayer.name}
                        </Text>
                        <Text style={[styles.timerValue, { color: Colors.secondary }]}>{timeLeft}</Text>
                        <Text style={[styles.timerInfo, { color: activeColors.textMuted }]}>
                            {lang === 'ar' ? 'وقت الأذان: ' : 'Adhan at: '}
                            {nextPrayer.time}
                        </Text>
                    </View>
                )}

                <View style={[styles.qiblaContainer, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.qiblaHeader}>
                        <Compass size={20} color={Colors.secondary} />
                        <Text style={[styles.sectionTitle, { color: activeColors.text, marginLeft: 8 }]}>{t.qibla}</Text>
                    </View>

                    <View style={styles.compassWrapper}>
                        <View style={styles.compassContainer}>
                            {/* Rotating Outer Dial */}
                            <Animated.View style={[styles.compassCircle, { transform: [{ rotate: rotateCompass }], borderColor: isDark ? '#333' : '#eee' }]}>
                                <Text style={styles.north}>N</Text>
                                <Text style={[styles.east, { color: activeColors.textMuted }]}>E</Text>
                                <Text style={[styles.south, { color: activeColors.textMuted }]}>S</Text>
                                <Text style={[styles.west, { color: activeColors.textMuted }]}>W</Text>
                            </Animated.View>

                            {/* Rotating Qibla Needle */}
                            <Animated.View style={[styles.needleContainer, { transform: [{ rotate: rotateNeedle }] }]}>
                                <View style={[styles.needleUpper, { backgroundColor: isAligned ? '#4CAF50' : '#FF9800' }]} />
                                <View style={styles.kaabaIconWrapper}>
                                    <View style={[styles.kaabaBadge, { backgroundColor: isAligned ? '#4CAF50' : Colors.secondary }]}>
                                        <Text style={styles.kaabaIconEmoji}>🕋</Text>
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Center Dot */}
                            <View style={[styles.centerPoint, { backgroundColor: isDark ? '#fff' : '#000' }]} />
                        </View>
                    </View>

                    <View style={styles.qiblaFooter}>
                        <View style={styles.angleInfo}>
                            <Navigation size={16} color={Colors.secondary} />
                            <Text style={[styles.angleText, { color: Colors.secondary }]}>{Math.round(qiblaFixed)}°</Text>
                        </View>
                        <Text style={[styles.guidanceText, { color: activeColors.textMuted }, isAligned && { color: '#4CAF50', fontWeight: 'bold' }]}>
                            {isAligned ? t.facingKaaba : t.rotatePhone}
                        </Text>
                        <Text style={[styles.calibrationText, { color: activeColors.textMuted }]}>
                            {lang === 'ar' ? 'حرك الهاتف بشكل 8 للمعايرة' : 'Move phone in ∞ shape to calibrate'}
                        </Text>
                    </View>
                </View>

                <View style={styles.prayerListContainer}>
                    <View style={styles.listHeader}>
                        <MapPin size={18} color={Colors.secondary} />
                        <Text style={[styles.sectionTitle, { color: activeColors.text, marginLeft: 8 }]}>{t.prayer}</Text>
                    </View>
                    {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => (
                        <View key={name} style={[
                            styles.prayerCard,
                            { backgroundColor: activeColors.surface },
                            nextPrayer?.name === name && { borderColor: Colors.secondary, borderWidth: 1 }
                        ]}>
                            <Text style={[styles.prayerName, { color: activeColors.text }]}>{t[name] || (name === 'Sunrise' ? (lang === 'ar' ? 'الشروق' : 'Sunrise') : name)}</Text>
                            <Text style={[styles.prayerTime, { color: Colors.secondary }]}>{timings?.[name]}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 15, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 15 },
    timerCard: { padding: 25, borderRadius: 25, marginBottom: 20, alignItems: 'center', borderWidth: 1 },
    timerSub: { fontSize: 12, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
    timerValue: { fontSize: 36, fontWeight: 'bold' },
    timerInfo: { fontSize: 13, marginTop: 5 },
    qiblaContainer: { padding: 20, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4, marginBottom: 20 },
    qiblaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    compassWrapper: { height: 260, justifyContent: 'center', alignItems: 'center' },
    compassContainer: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center' },
    compassCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    north: { position: 'absolute', top: 10, color: '#FF4D4D', fontWeight: 'bold', fontSize: 16 },
    east: { position: 'absolute', right: 10, fontSize: 14, fontWeight: '600' },
    south: { position: 'absolute', bottom: 10, fontSize: 14, fontWeight: '600' },
    west: { position: 'absolute', left: 10, fontSize: 14, fontWeight: '600' },
    needleContainer: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center', position: 'absolute' },
    needleUpper: { width: 6, height: 100, borderRadius: 3, marginBottom: 100, shadowColor: '#000', shadowOpacity: 0.2, elevation: 2 },
    kaabaIconWrapper: { position: 'absolute', top: 5, alignItems: 'center' },
    kaabaBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },
    kaabaIconEmoji: { fontSize: 24 },
    centerPoint: { width: 14, height: 14, borderRadius: 7, position: 'absolute', borderWidth: 2, borderColor: '#fff' },
    qiblaFooter: { marginTop: 20, alignItems: 'center' },
    angleInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    angleText: { fontSize: 18, fontWeight: 'bold', marginLeft: 5 },
    guidanceText: { fontSize: 15, marginBottom: 8 },
    calibrationText: { fontSize: 11, fontStyle: 'italic' },
    prayerListContainer: { marginBottom: 30 },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingLeft: 5 },
    prayerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderRadius: 20, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    prayerName: { fontSize: 16, fontWeight: '600' },
    prayerTime: { fontSize: 16, fontWeight: 'bold' },
});

export default PrayerScreen;
