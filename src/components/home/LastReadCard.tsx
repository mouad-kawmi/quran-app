import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

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

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? activeColors.surface : '#FFFBF5',
                    borderColor: Colors.secondary,
                },
            ]}
            onPress={onPress}
        >
            <View style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Clock size={18} color={Colors.secondary} />
                    <Text style={[styles.label, { color: Colors.secondary }]}>
                        {translations.lastRead}
                    </Text>
                </View>

                <Text style={[styles.title, { color: activeColors.text }]}>
                    {lang === 'ar' ? (lastRead.arabicName || lastRead.name) : lastRead.name}
                </Text>

                <Text style={[styles.ayahLabel, { color: activeColors.textMuted }]}>
                    {lang === 'ar' ? `الآية ${lastRead.ayahNumber}` : `Ayah ${lastRead.ayahNumber}`}
                </Text>
            </View>

            <View style={styles.arrowContainer}>
                <ChevronRight size={24} color={Colors.secondary} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 25,
        borderRadius: 25,
        marginBottom: 25,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
        opacity: 0.8
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold'
    },
    ayahLabel: {
        fontSize: 12,
        opacity: 0.8
    },
    arrowContainer: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: 'rgba(212,175,55,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default LastReadCard;
