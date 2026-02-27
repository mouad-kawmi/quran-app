import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

const KhatmaProgress = ({ percentage, remainingDays, lang, t, activeColors }: any) => {
    return (
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.surfaceLight }]}>
            <View style={styles.header}>
                <Text style={[styles.label, { color: activeColors.text }]}>{t.progress}</Text>
                <Text style={[styles.percent, { color: Colors.secondary }]}>{percentage}%</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: activeColors.surfaceLight }]}>
                <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: Colors.secondary }]} />
            </View>
            <Text style={[styles.sub, { color: activeColors.textMuted }]}>
                {lang === 'ar' ? `تبقي ${remainingDays} أيام للختم` : `${remainingDays} days remaining`}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { padding: 20, borderRadius: 25, marginBottom: 20, borderWidth: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600' },
    percent: { fontSize: 18, fontWeight: 'bold' },
    barBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
    barFill: { height: '100%', borderRadius: 5 },
    sub: { fontSize: 12 },
});

export default KhatmaProgress;
