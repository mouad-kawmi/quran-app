import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Surah } from '../api/quranApi';

interface SurahCardProps {
    surah: Surah;
    onPress: () => void;
    lang: string;
    theme: 'dark' | 'light';
}

const SurahCard: React.FC<SurahCardProps> = ({ surah, onPress, lang, theme }) => {
    const isAr = lang === 'ar';
    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    const revType = surah.revelationType === 'Meccan'
        ? (isAr ? 'مكية' : 'Meccan')
        : (isAr ? 'مدنية' : 'Medinan');

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftSection}>
                <View style={styles.numberBadge}>
                    <Text style={styles.number}>{surah.number}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={[styles.englishName, { color: activeColors.text }]} numberOfLines={1}>
                        {isAr ? surah.name.replace('سُورَةُ ', '') : surah.englishName}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: activeColors.textMuted }]}>
                            {revType} • {surah.numberOfAyahs} {isAr ? 'آية' : 'Ayahs'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.rightSection}>
                <Text style={[styles.arabicName, { color: activeColors.text }]} numberOfLines={1}>
                    {surah.name}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 4,
        marginVertical: 6,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    numberBadge: {
        width: 42,
        height: 42,
        borderRadius: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        transform: [{ rotate: '45deg' }]
    },
    number: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.secondary,
        transform: [{ rotate: '-45deg' }]
    },
    infoContainer: {
        justifyContent: 'center',
        flex: 1,
    },
    englishName: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rightSection: {
        alignItems: 'flex-end',
        marginLeft: 15,
    },
    arabicName: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
        color: Colors.secondary,
    },
});

export default SurahCard;
