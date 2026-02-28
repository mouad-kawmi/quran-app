import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, ChevronRight, Bookmark } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    lastRead: any;
    lang: string;
    isDark: boolean;
    activeColors: any;
    onPress: () => void;
    translations: any;
}

/**
 * Shows the last ayah the user read so they can jump back in.
 */
const LastReadCard = ({ lastRead, lang, isDark, activeColors, onPress, translations }: Props) => {
    if (!lastRead) return null;

    const isAr = lang === 'ar';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#1B4332', '#081C15'] : ['#E9F5E9', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.card}
            >
                <View style={styles.leftSection}>
                    <View style={styles.iconContainer}>
                        <Bookmark size={20} color={Colors.secondary} fill={Colors.secondary} />
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.headerRow}>
                            <Clock size={12} color={activeColors.textMuted} />
                            <Text style={[styles.label, { color: activeColors.textMuted }]}>
                                {translations.lastRead}
                            </Text>
                        </View>
                        <Text style={[styles.title, { color: activeColors.text }]}>
                            {isAr ? (lastRead.arabicName || lastRead.name) : lastRead.name}
                        </Text>
                        <Text style={[styles.ayahLabel, { color: Colors.secondary }]}>
                            {isAr ? `الآية ${lastRead.ayahNumber}` : `Ayah ${lastRead.ayahNumber}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.arrowContainer}>
                    <ChevronRight size={20} color={isDark ? Colors.white : Colors.black} style={{ transform: [{ scaleX: isAr ? -1 : 1 }] }} />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 25,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    card: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 2,
    },
    ayahLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    arrowContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});

export default LastReadCard;
