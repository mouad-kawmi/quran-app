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
        <View style={[styles.header, { borderBottomColor: activeColors.border + '20', paddingTop: topInset, height: 70 + topInset }]}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}><ChevronLeft size={28} color={Colors.secondary} /></TouchableOpacity>
            <View style={styles.info}>
                <Text style={[styles.text, { color: activeColors.textMuted }]}>{lang === 'ar' ? `الجزء ${juz}` : `Juz ${juz}`}</Text>
                <Text style={[styles.title, { color: Colors.secondary }]}>{surahName}</Text>
                <Text style={[styles.text, { color: activeColors.textMuted }]}>{lang === 'ar' ? `صفحة ${page}` : `Page ${page}`}</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: 1, zIndex: 10 },
    backBtn: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1, alignItems: 'center' },
    title: { fontSize: 18, fontWeight: 'bold' },
    text: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
});

export default DetailHeader;
