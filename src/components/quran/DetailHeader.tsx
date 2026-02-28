import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface Props {
    onBack: () => void;
    lang: string;
    activeColors: any;
    juz: number;
    page: number;
    surahName: string;
    topInset: number;
}

const DetailHeader = ({ onBack, lang, activeColors, juz, page, surahName, topInset }: Props) => {
    return (
        <View style={[styles.header, { borderBottomColor: activeColors.border + '20', paddingTop: topInset, height: 110 + topInset }]}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ChevronLeft size={28} color={Colors.secondary} />
            </TouchableOpacity>

            <View style={styles.centerInfo}>
                <View style={styles.topInfoRow}>
                    <Text style={[styles.superText, { color: activeColors.textMuted }]}>
                        {lang === 'ar' ? `الجزء ${juz}` : `Juz ${juz}`}
                    </Text>
                </View>

                <Text style={[styles.title, { color: Colors.secondary }]}>{surahName}</Text>

                <View style={styles.bottomInfoRow}>
                    <Text style={[styles.subText, { color: activeColors.textMuted }]}>
                        {lang === 'ar' ? `صفحة ${page}` : `Page ${page}`}
                    </Text>
                </View>
            </View>

            <View style={styles.rightSpacer} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        zIndex: 10,
        justifyContent: 'space-between',
    },
    backBtn: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
    centerInfo: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    topInfoRow: {
        marginBottom: 2,
    },
    bottomInfoRow: {
        marginTop: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    superText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.7
    },
    subText: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.5
    },
    rightSpacer: { width: 45 },
});

export default DetailHeader;
