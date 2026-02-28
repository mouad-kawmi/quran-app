import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Share, Alert, ScrollView } from 'react-native';
import { X, Image as ImageIcon, Copy, Share2, Check } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
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
    const isAr = lang === 'ar';
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const textToCopy = `${selectedAyah?.t}\n\n[${arabicName} : ${selectedAyah?.ns}]`;
        await Clipboard.setStringAsync(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareText = async () => {
        const textToShare = `${selectedAyah?.t}\n\n[${arabicName} : ${selectedAyah?.ns}]`;
        await Share.share({ message: textToShare });
    };

    const textLength = selectedAyah?.t?.length || 0;
    let adaptiveFontSize = 26;
    let adaptiveLineHeight = 54;

    if (textLength > 600) {
        adaptiveFontSize = 16;
        adaptiveLineHeight = 34;
    } else if (textLength > 250) {
        adaptiveFontSize = 20;
        adaptiveLineHeight = 44;
    }

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.modal, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: activeColors.text }]}>{isAr ? 'مشاركة الآية' : 'Share Ayah'}</Text>
                            <TouchableOpacity onPress={onClose}><X size={24} color={activeColors.text} /></TouchableOpacity>
                        </View>

                        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                            <LinearGradient
                                colors={['#081C15', '#1B4332', '#081C15']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.shareCard}
                            >
                                <View style={styles.cardInnerBorder}>
                                    <Text style={styles.cardHeader}>الْقُرْآنُ الْكَرِيمُ</Text>
                                    <Text style={[styles.cardArabic, { fontSize: adaptiveFontSize, lineHeight: adaptiveLineHeight }]}>{selectedAyah?.t}</Text>
                                    <Text style={styles.cardRef}>سورة {arabicName} ﴿ {selectedAyah?.ns} ﴾</Text>
                                </View>
                            </LinearGradient>
                        </ViewShot>

                        <View style={styles.actionsContainer}>
                            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: Colors.secondary }]} onPress={onShareImage}>
                                <ImageIcon size={20} color="#000" />
                                <Text style={styles.primaryBtnText}>{isAr ? 'مشاركة كصورة' : 'Share as Image'}</Text>
                            </TouchableOpacity>

                            <View style={styles.secondaryActions}>
                                <TouchableOpacity style={[styles.secondaryBtn, { borderColor: activeColors.border }]} onPress={handleShareText}>
                                    <Share2 size={20} color={activeColors.text} />
                                    <Text style={[styles.secondaryBtnText, { color: activeColors.text }]}>{isAr ? 'مشاركة كنص' : 'Share Text'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.secondaryBtn, { borderColor: copied ? Colors.accent : activeColors.border }]} onPress={handleCopy}>
                                    {copied ? <Check size={20} color={Colors.accent} /> : <Copy size={20} color={activeColors.text} />}
                                    <Text style={[styles.secondaryBtnText, { color: copied ? Colors.accent : activeColors.text }]}>
                                        {copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ النص' : 'Copy Text')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },
    modal: { width: '100%', borderRadius: 30, padding: 20 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold' },
    shareCard: {
        borderRadius: 20,
        padding: 4,
        marginBottom: 25,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    cardInnerBorder: {
        borderWidth: 1,
        borderColor: Colors.secondary + '60',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
    },
    cardHeader: { color: Colors.secondary, fontWeight: 'bold', fontSize: 16, marginBottom: 25, letterSpacing: 2 },
    cardArabic: { color: Colors.white, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
    cardRef: { color: Colors.secondary, fontSize: 16, fontWeight: 'bold', borderTopWidth: 1, borderTopColor: Colors.secondary + '40', paddingTop: 15, width: '90%', textAlign: 'center' },
    actionsContainer: { gap: 12 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15 },
    primaryBtnText: { fontWeight: 'bold', fontSize: 16, marginLeft: 10, color: '#000' },
    secondaryActions: { flexDirection: 'row', gap: 12 },
    secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 15, borderWidth: 1 },
    secondaryBtnText: { fontWeight: '600', fontSize: 14, marginLeft: 8 }
});

export default ShareModal;
