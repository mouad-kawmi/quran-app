import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { RemoteVerse } from '../../api/remoteContent';

interface Props {
    dailyVerse: RemoteVerse;
    lang: string;
    activeColors: any;
}

/**
 * Simple component to show the "Ayah of the Day"
 */
const DailyVerseCard = ({ dailyVerse, lang, activeColors }: Props) => {
    return (
        <View style={[styles.card, { backgroundColor: Colors.secondary + '15' }]}>
            <View style={styles.header}>
                <Heart size={16} color={Colors.secondary} fill={Colors.secondary} />
                <Text style={[styles.title, { color: Colors.secondary }]}>
                    {lang === 'ar' ? 'آية اليوم' : 'Verse of the Day'}
                </Text>
            </View>

            <Text style={[styles.verseText, { color: activeColors.text }]}>
                {dailyVerse.verse}
            </Text>

            <Text style={[styles.translationText, { color: activeColors.textMuted }]}>
                {dailyVerse.translation}
            </Text>

            <Text style={[styles.referenceText, { color: Colors.secondary }]}>
                {dailyVerse.surah} : {dailyVerse.ayah}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        marginTop: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8
    },
    verseText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'right',
        lineHeight: 32,
        marginBottom: 10
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 10
    },
    referenceText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'right'
    },
});

export default DailyVerseCard;
