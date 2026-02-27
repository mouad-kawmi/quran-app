import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const KhatmaSetup = ({ onSetPlan, lang, t, activeColors }: any) => {
    const [selectedDays, setSelectedDays] = React.useState(30);

    return (
        <View style={styles.container}>
            <Trophy size={60} color={Colors.secondary} style={{ marginBottom: 20 }} />
            <Text style={[styles.text, { color: activeColors.text }]}>
                {lang === 'ar' ? "كم يوماً تريد ختم القرآن؟" : "In how many days do you want to complete the Quran?"}
            </Text>
            <View style={styles.row}>
                {[3, 7, 10, 30].map(d => (
                    <TouchableOpacity key={d} style={[styles.btn, { backgroundColor: activeColors.surface, borderColor: activeColors.surfaceLight }, selectedDays === d && { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '15' }]} onPress={() => setSelectedDays(d)}>
                        <Text style={[styles.btnText, { color: activeColors.text }, selectedDays === d && { color: Colors.secondary }]}>{d}</Text>
                        <Text style={[styles.btnLabel, { color: activeColors.textMuted }, selectedDays === d && { color: Colors.secondary }]}>{t.day}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: Colors.secondary }]} onPress={() => onSetPlan(selectedDays)}>
                <Text style={styles.startBtnText}>{t.startReading}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 30, alignItems: 'center' },
    text: { fontSize: 20, marginBottom: 40, textAlign: 'center', fontWeight: '600' },
    row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 50 },
    btn: { width: width * 0.18, height: width * 0.18, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    btnText: { fontSize: 22, fontWeight: 'bold' },
    btnLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    startBtn: { paddingVertical: 18, paddingHorizontal: 60, borderRadius: 20 },
    startBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});

export default KhatmaSetup;
