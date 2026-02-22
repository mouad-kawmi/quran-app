import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Vibration, Animated, Dimensions, ScrollView } from 'react-native';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { Storage } from '../utils/storage';
import { RotateCcw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DHIKR_LIST = [
    { id: 1, arabic: 'سُبْحَانَ اللهِ', english: 'SubhanAllah' },
    { id: 2, arabic: 'الْحَمْدُ لِلَّهِ', english: 'Alhamdulillah' },
    { id: 3, arabic: 'اللهُ أَكْبَرُ', english: 'Allahu Akbar' },
    { id: 4, arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', english: 'La ilaha illallah' },
];

interface Props {
    lang: string;
    theme: 'dark' | 'light';
}

const TasbihScreen = ({ lang, theme }: Props) => {
    const t = Translations[lang];
    const [count, setCount] = useState(0);
    const [activeDhikr, setActiveDhikr] = useState(DHIKR_LIST[0]);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    const handlePress = () => {
        const newCount = count + 1;
        setCount(newCount);
        Storage.saveTasbih(newCount);

        // Haptic feedback
        try {
            Vibration.vibrate(40);
        } catch (e) { }

        // Animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Check milestones
        if ((count + 1) === 33 || (count + 1) === 99 || (count + 1) === 100) {
            Vibration.vibrate([0, 100, 50, 100]);
        }
    };

    React.useEffect(() => {
        loadLastCount();
    }, []);

    const loadLastCount = async () => {
        const lastCount = await Storage.getTasbih();
        if (lastCount !== null) setCount(lastCount);
    };

    const resetCount = () => {
        setCount(0);
        Storage.saveTasbih(0);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.headerTitle, { color: Colors.secondary }]}>{t.tasbih}</Text>
            </View>

            <View style={[styles.dhikrSelector, { backgroundColor: activeColors.surface }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dhikrScroll}>
                    {DHIKR_LIST.map((d) => (
                        <TouchableOpacity
                            key={d.id}
                            style={[
                                styles.dhikrTab,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                                activeDhikr.id === d.id && { backgroundColor: Colors.secondary }
                            ]}
                            onPress={() => { setActiveDhikr(d); resetCount(); }}
                        >
                            <Text style={[
                                styles.dhikrTabAr,
                                { color: activeColors.textMuted },
                                activeDhikr.id === d.id && { color: Colors.dark.background, fontWeight: 'bold' }
                            ]}>{d.arabic}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.content}>
                <View style={styles.dhikrDisplay}>
                    <Text style={[styles.activeArabicText, { color: Colors.secondary }]}>{activeDhikr.arabic}</Text>
                    <Text style={[styles.activeEnglishText, { color: activeColors.textMuted }]}>{activeDhikr.english}</Text>
                </View>

                <View style={styles.counterContainer}>
                    <Text style={[styles.countNumber, { color: activeColors.text }]}>{count}</Text>
                    <Text style={[styles.countTotal, { color: Colors.accent }]}>/ 100</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handlePress}
                    style={styles.tapWrapper}
                >
                    <Animated.View style={[
                        styles.tapButton,
                        {
                            transform: [{ scale: scaleAnim }],
                            backgroundColor: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.2)',
                            borderColor: Colors.secondary
                        }
                    ]}>
                        <View style={[styles.innerButton, { backgroundColor: activeColors.surface }]}>
                            <Text style={styles.pressLabel}>👆</Text>
                        </View>
                    </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resetBtn} onPress={resetCount}>
                    <Text style={[styles.resetBtnText, { color: activeColors.textMuted }]}>↺ {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    dhikrSelector: { height: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    dhikrScroll: { paddingHorizontal: 15, alignItems: 'center' },
    dhikrTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    dhikrTabAr: { fontSize: 13 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 40 },
    dhikrDisplay: { alignItems: 'center' },
    activeArabicText: { fontSize: 32, marginBottom: 5 },
    activeEnglishText: { fontSize: 16, opacity: 0.8 },
    counterContainer: { flexDirection: 'row', alignItems: 'baseline' },
    countNumber: { fontSize: 80, fontWeight: '200' },
    countTotal: { fontSize: 24, marginLeft: 10, opacity: 0.6 },
    tapWrapper: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
    tapButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10
    },
    innerButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pressLabel: { fontSize: 32 },
    resetBtn: { padding: 10 },
    resetBtnText: { textDecorationLine: 'underline', fontSize: 16 }
});

export default TasbihScreen;
