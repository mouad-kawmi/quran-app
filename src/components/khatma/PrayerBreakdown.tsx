import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const PrayerBreakdown = ({ pagesPerJuz = 20, juzsCount, lang, t, activeColors }: any) => {
    const totalPages = Math.round(juzsCount * pagesPerJuz);
    const pagesPerPrayer = Math.ceil(totalPages / 5);

    const prayers = [
        { name: t.Fajr, icon: '🌅' },
        { name: t.Dhuhr, icon: '☀️' },
        { name: t.Asr, icon: '🌤️' },
        { name: t.Maghrib, icon: '🌇' },
        { name: t.Isha, icon: '🌙' },
    ];

    return (
        <View style={[styles.card, { backgroundColor: activeColors.surface }]}>
            <View style={styles.header}>
                <Clock size={18} color={Colors.secondary} />
                <Text style={[styles.title, { color: activeColors.text }]}>{t.prayerBreakdown}</Text>
            </View>
            <View style={styles.grid}>
                {prayers.map((p, i) => (
                    <View key={i} style={styles.item}>
                        <Text style={styles.icon}>{p.icon}</Text>
                        <Text style={[styles.name, { color: activeColors.textMuted }]}>{p.name}</Text>
                        <Text style={[styles.amount, { color: activeColors.text }]}>{pagesPerPrayer} {t.pages}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { padding: 20, borderRadius: 25, marginBottom: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    item: { width: '30%', alignItems: 'center', marginBottom: 15 },
    icon: { fontSize: 20, marginBottom: 4 },
    name: { fontSize: 12, marginBottom: 2 },
    amount: { fontSize: 13, fontWeight: 'bold' }
});

export default PrayerBreakdown;
