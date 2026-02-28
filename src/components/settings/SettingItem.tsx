import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';

const SettingItem = ({ label, value, onPress, activeColors, icon, children, btnText, isAr }: any) => {
    return (
        <View style={[styles.item, { backgroundColor: activeColors.surface, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.label, { color: activeColors.text, textAlign: isAr ? 'right' : 'left' }]}>{label}</Text>
                {value ? <Text style={[styles.value, { color: activeColors.textMuted, textAlign: isAr ? 'right' : 'left' }]}>{value}</Text> : null}
            </View>
            {children ? children : (
                <TouchableOpacity style={[styles.btn, isAr ? { marginRight: 15 } : { marginLeft: 15 }]} onPress={onPress}>
                    {icon ? icon : <Text style={styles.btnText}>{btnText || "Change"}</Text>}
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
