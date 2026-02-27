import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Play, BookOpen, Languages, Bookmark, Share2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface Props {
    visible: boolean;
    onClose: () => void;
    lang: string;
    activeColors: any;
    arabicName: string;
    selectedAyah: any;
    onPlay: () => void;
    onShowTafsir: () => void;
    onShowTranslation: () => void;
    onToggleBookmark: () => void;
    onShare: () => void;
    isBookmarked: boolean;
}

const OptionsSheet = ({ visible, onClose, lang, activeColors, arabicName, selectedAyah, onPlay, onShowTafsir, onShowTranslation, onToggleBookmark, onShare, isBookmarked }: Props) => {
    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.sheet, { backgroundColor: activeColors.surface }]}>
                    <View style={[styles.handle, { backgroundColor: activeColors.textMuted }]} />
                    <Text style={[styles.title, { color: Colors.secondary }]}>{arabicName} ({selectedAyah?.ns})</Text>

                    <View style={styles.grid}>
                        <OptionItem icon={<Play size={24} color={Colors.secondary} />} label={lang === 'ar' ? 'استماع' : 'Audio'} color={Colors.secondary} onPress={onPlay} activeColors={activeColors} />
                        <OptionItem icon={<BookOpen size={24} color={Colors.accent} />} label={lang === 'ar' ? 'تفسير' : 'Tafsir'} color={Colors.accent} onPress={onShowTafsir} activeColors={activeColors} />
                        <OptionItem icon={<Languages size={24} color="#4A90E2" />} label={lang === 'ar' ? 'ترجمة' : 'Translation'} color="#4A90E2" onPress={onShowTranslation} activeColors={activeColors} />
                        <OptionItem
                            icon={<Bookmark size={24} color={Colors.secondary} fill={isBookmarked ? Colors.secondary : 'transparent'} />}
                            label={lang === 'ar' ? 'حفظ' : 'Save'} color={Colors.secondary} onPress={onToggleBookmark} activeColors={activeColors}
                        />
                        <OptionItem icon={<Share2 size={24} color="#FF6B6B" />} label={lang === 'ar' ? 'مشاركة' : 'Share'} color="#FF6B6B" onPress={onShare} activeColors={activeColors} />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const OptionItem = ({ icon, label, color, onPress, activeColors }: any) => (
    <TouchableOpacity style={styles.optItem} onPress={onPress}>
        <View style={[styles.optIcon, { backgroundColor: color + '15' }]}>{icon}</View>
        <Text style={[styles.optLabel, { color: activeColors.text }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 60 },
    handle: { width: 45, height: 6, borderRadius: 3, alignSelf: 'center', marginBottom: 25, opacity: 0.15 },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
    grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    optItem: { alignItems: 'center', width: '20%' },
    optIcon: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    optLabel: { fontSize: 11, fontWeight: 'bold' },
});

export default OptionsSheet;
