import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Heart, Share2, Copy } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { RemoteVerse } from '../../api/remoteContent';
import { LinearGradient } from 'expo-linear-gradient';

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
        <LinearGradient
            colors={['#1B4332', '#081C15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconCircle}>
                        <Heart size={14} color={Colors.secondary} fill={Colors.secondary} />
                    </View>
                    <Text style={styles.title}>
                        {lang === 'ar' ? 'آية اليوم' : 'Verse of the Day'}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <Copy size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 15 }} />
                    <Share2 size={18} color="rgba(255,255,255,0.6)" />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.verseText}>
                    {dailyVerse.verse}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.translationText}>
                    {dailyVerse.translation}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.surahBadge}>
                        <Text style={styles.referenceText}>
                            {dailyVerse.surah} • {dailyVerse.ayah}
                        </Text>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.secondary,
        letterSpacing: 0.5,
    },
    content: {
        alignItems: 'center',
    },
    verseText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 40,
        fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
    },
    divider: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(212, 175, 55, 0.3)',
        marginVertical: 15,
        borderRadius: 1,
    },
    translationText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    footer: {
        width: '100%',
        alignItems: 'flex-end',
    },
    surahBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    referenceText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.secondary,
    },
});

export default DailyVerseCard;
