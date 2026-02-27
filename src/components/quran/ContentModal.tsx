import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface Props {
    visible: boolean;
    onClose: () => void;
    lang: string;
    activeColors: any;
    type: 'translation' | 'tafsir';
    selectedAyah: any;
    contentText: string;
}

const ContentModal = ({ visible, onClose, lang, activeColors, type, selectedAyah, contentText }: Props) => {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Colors.secondary }]}>
                            {type === 'tafsir' ? (lang === 'ar' ? 'تفسير الجلالين' : 'Tafsir Muyassar') : (lang === 'ar' ? 'ترجمة معاني' : 'English Translation')}
                        </Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color={activeColors.text} /></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.scroll}>
                        <Text style={[styles.arabicText, { color: activeColors.text }]}>{selectedAyah?.t}</Text>
                        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                        <Text style={[styles.text, { color: activeColors.text, textAlign: type === 'tafsir' ? 'right' : 'left' }]}>
                            {contentText}
                        </Text>
                    </ScrollView>
                    <TouchableOpacity style={[styles.closeBtn, { backgroundColor: Colors.secondary }]} onPress={onClose}>
                        <Text style={styles.closeText}>{lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modal: { width: '100%', borderRadius: 25, padding: 20, maxHeight: '80%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold' },
    scroll: { marginBottom: 20 },
    arabicText: { fontSize: 22, textAlign: 'right', lineHeight: 40, marginBottom: 20 },
    divider: { height: 1, width: '100%', marginBottom: 20, opacity: 0.1 },
    text: { fontSize: 17, lineHeight: 28 },
    closeBtn: { paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    closeText: { fontWeight: 'bold', fontSize: 16, color: '#000' },
});

export default ContentModal;
