import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { X, Download, Copy } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import { Colors } from '../../constants/Colors';

interface Props {
    visible: boolean;
    onClose: () => void;
    lang: string;
    activeColors: any;
    selectedAyah: any;
    arabicName: string;
    viewShotRef: any;
    onShareImage: () => void;
}

const ShareModal = ({ visible, onClose, lang, activeColors, selectedAyah, arabicName, viewShotRef, onShareImage }: Props) => {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: activeColors.text }]}>{lang === 'ar' ? 'مشاركة الآية' : 'Share Ayah'}</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color={activeColors.text} /></TouchableOpacity>
                    </View>

                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                        <View style={[styles.shareCard, { backgroundColor: Colors.secondary }]}>
                            <Text style={styles.cardHeader}>القرآن الكريم</Text>
                            <Text style={styles.cardArabic}>{selectedAyah?.t}</Text>
                            <Text style={styles.cardRef}>{arabicName} [{selectedAyah?.ns}]</Text>
                        </View>
                    </ViewShot>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]} onPress={onShareImage}>
                        <Download size={20} color="#000" />
                        <Text style={styles.actionText}>{lang === 'ar' ? 'حفظ كصورة' : 'Save as Image'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.secondary }]}
                        onPress={() => {
                            Share.share({ message: `${selectedAyah?.t}\n\n[${arabicName} : ${selectedAyah?.ns}]` });
                            onClose();
                        }}
                    >
                        <Copy size={20} color={Colors.secondary} />
                        <Text style={[styles.actionText, { color: Colors.secondary }]}>{lang === 'ar' ? 'نسخ النص' : 'Copy Text'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modal: { width: '100%', borderRadius: 30, padding: 25 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold' },
    shareCard: { padding: 30, borderRadius: 25, alignItems: 'center', marginBottom: 25 },
    cardHeader: { color: 'rgba(0,0,0,0.4)', fontWeight: 'bold', fontSize: 12, marginBottom: 20, letterSpacing: 2 },
    cardArabic: { color: '#000', fontSize: 22, fontWeight: 'bold', textAlign: 'center', lineHeight: 45, marginBottom: 25 },
    cardRef: { color: '#000', fontSize: 14, fontWeight: 'bold', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 15, width: '100%', textAlign: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, marginBottom: 12 },
    actionText: { fontWeight: 'bold', fontSize: 15, marginLeft: 10, color: '#000' }
});

export default ShareModal;
