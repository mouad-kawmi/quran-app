import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SettingItem = ({ label, value, onPress, activeColors, icon, children }: any) => {
    return (
        <View style={[styles.item, { backgroundColor: activeColors.surface }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: activeColors.text }]}>{label}</Text>
                <Text style={[styles.value, { color: activeColors.textMuted }]}>{value}</Text>
            </View>
            {children ? children : (
                <TouchableOpacity style={styles.btn} onPress={onPress}>
                    {icon ? icon : <Text style={styles.btnText}>Change</Text>}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 15, marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600' },
    value: { fontSize: 12, marginTop: 4 },
    btn: { backgroundColor: '#D4AF37', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    btnText: { fontWeight: 'bold', color: '#081C15' },
});

export default SettingItem;
