import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Animated, Easing, Platform, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { Storage } from '../utils/storage';
import { Compass, Navigation } from 'lucide-react-native';

interface Props {
    lang: string;
    theme: 'dark' | 'light';
}

const QiblaScreen = ({ lang, theme }: Props) => {
    const t = Translations[lang];
    const [loading, setLoading] = useState(true);
    const [qiblaFixed, setQiblaFixed] = useState(0);
    const [heading, setHeading] = useState(0);
    const animatedHeading = useRef(new Animated.Value(0)).current;

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        let headingSubscription: any = null;

        (async () => {
            try {
                // 1. Load Last Location from Cache first for immediate display
                const cachedLoc = await Storage.getLocation();
                if (cachedLoc) {
                    calculateQibla(cachedLoc.latitude, cachedLoc.longitude);
                    setLoading(false); // Stop loading if we have cache
                }

                // 2. Request fresh location
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    // If no permission but we have cache, we just keep using cache
                    if (!cachedLoc) {
                        calculateQibla(33.5731, -7.5898); // Fallback to Casablanca
                        setLoading(false);
                    }
                    return;
                }

                // Try to get fresh location, but with a timeout
                try {
                    let loc = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced, // Balanced is faster and more offline-friendly
                    });
                    const { latitude, longitude } = loc.coords;
                    calculateQibla(latitude, longitude);
                    await Storage.saveLocation(latitude, longitude);
                } catch (locErr) {
                    console.log("[Qibla] Could not get fresh location, using cache/default");
                    if (!cachedLoc) calculateQibla(33.5731, -7.5898);
                }

                // 3. Start Compass
                headingSubscription = await Location.watchHeadingAsync((data) => {
                    const currentHeading = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;

                    Animated.timing(animatedHeading, {
                        toValue: currentHeading,
                        duration: 150,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }).start();

                    setHeading(currentHeading);
                });

            } catch (e) {
                console.error("[Qibla] Init Error:", e);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            if (headingSubscription) headingSubscription.remove();
        };
    }, []);

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

    const needleRotation = (qiblaFixed - heading + 360) % 360;
    const isAligned = needleRotation > 355 || needleRotation < 5;

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
                <Text style={[styles.title, { color: Colors.secondary }]}>{t.qibla}</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.qiblaContainer, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.qiblaHeader}>
                        <Compass size={24} color={Colors.secondary} />
                        <Text style={[styles.sectionTitle, { color: activeColors.text, marginLeft: 10 }]}>{t.qibla}</Text>
                    </View>

                    <View style={styles.compassWrapper}>
                        <View style={styles.compassContainer}>
                            <Animated.View style={[styles.compassCircle, { transform: [{ rotate: rotateCompass }], borderColor: isDark ? '#333' : '#eee' }]}>
                                <Text style={styles.north}>N</Text>
                                <Text style={[styles.east, { color: activeColors.textMuted }]}>E</Text>
                                <Text style={[styles.south, { color: activeColors.textMuted }]}>S</Text>
                                <Text style={[styles.west, { color: activeColors.textMuted }]}>W</Text>
                            </Animated.View>

                            <Animated.View style={[styles.needleContainer, { transform: [{ rotate: rotateNeedle }] }]}>
                                <View style={[styles.needleUpper, { backgroundColor: isAligned ? '#4CAF50' : '#FF9800' }]} />
                                <View style={styles.kaabaIconWrapper}>
                                    <View style={[styles.kaabaBadge, { backgroundColor: isAligned ? '#4CAF50' : Colors.secondary }]}>
                                        <Text style={styles.kaabaIconEmoji}>🕋</Text>
                                    </View>
                                </View>
                            </Animated.View>

                            <View style={[styles.centerPoint, { backgroundColor: isDark ? '#fff' : '#000' }]} />
                        </View>
                    </View>

                    <View style={styles.qiblaFooter}>
                        <View style={styles.angleInfo}>
                            <Navigation size={22} color={Colors.secondary} />
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
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    title: { fontSize: 22, fontWeight: 'bold' },
    content: { flex: 1, justifyContent: 'center', padding: 20 },
    qiblaContainer: { padding: 30, borderRadius: 40, shadowColor: '#000', shadowOpacity: 0.1, elevation: 8, alignItems: 'center' },
    qiblaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold' },
    compassWrapper: { height: 300, justifyContent: 'center', alignItems: 'center' },
    compassContainer: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center' },
    compassCircle: { width: 260, height: 260, borderRadius: 130, borderWidth: 3, position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    north: { position: 'absolute', top: 15, color: '#FF4D4D', fontWeight: 'bold', fontSize: 18 },
    east: { position: 'absolute', right: 15, fontSize: 16, fontWeight: '600' },
    south: { position: 'absolute', bottom: 15, fontSize: 16, fontWeight: '600' },
    west: { position: 'absolute', left: 15, fontSize: 16, fontWeight: '600' },
    needleContainer: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center', position: 'absolute' },
    needleUpper: { width: 8, height: 120, borderRadius: 4, marginBottom: 120, shadowColor: '#000', shadowOpacity: 0.2, elevation: 2 },
    kaabaIconWrapper: { position: 'absolute', top: 10, alignItems: 'center' },
    kaabaBadge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },
    kaabaIconEmoji: { fontSize: 28 },
    centerPoint: { width: 16, height: 16, borderRadius: 8, position: 'absolute', borderWidth: 2, borderColor: '#fff' },
    qiblaFooter: { marginTop: 30, alignItems: 'center' },
    angleInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    angleText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
    guidanceText: { fontSize: 18, marginBottom: 10, textAlign: 'center' },
    calibrationText: { fontSize: 13, fontStyle: 'italic', opacity: 0.7 },
});

export default QiblaScreen;
