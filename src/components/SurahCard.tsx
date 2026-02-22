import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
            style={[styles.container, { backgroundColor: activeColors.surface }]}
            onPress={onPress}
        >
            <View style={styles.leftSection}>
                <View style={[styles.numberContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                    <Text style={[styles.number, { color: Colors.secondary }]}>{surah.number}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={[styles.englishName, { color: activeColors.text }]} numberOfLines={1}>{surah.englishName}</Text>
                    <Text style={[styles.translation, { color: activeColors.textMuted }]} numberOfLines={1}>
                        {isAr ? surah.englishNameTranslation : surah.englishNameTranslation}
                    </Text>
                </View>
            </View>
            <View style={styles.rightSection}>
                <Text style={[styles.arabicName, { color: Colors.secondary }]} numberOfLines={1}>{surah.name}</Text>
                <Text style={[styles.ayahCount, { color: activeColors.textMuted }]}>{surah.numberOfAyahs} {isAr ? 'آية' : 'Ayahs'}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        elevation: 1
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    numberContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    number: {
        fontSize: 14,
        fontWeight: 'bold'
    },
    infoContainer: {
        justifyContent: 'center',
    },
    englishName: {
        fontSize: 16,
        fontWeight: '600'
    },
    translation: {
        fontSize: 12,
        marginTop: 2,
    },
    rightSection: {
        alignItems: 'flex-end',
        flex: 1,
    },
    arabicName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    ayahCount: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default SurahCard;
