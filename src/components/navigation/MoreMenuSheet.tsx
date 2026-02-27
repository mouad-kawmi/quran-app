import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search, Book, RotateCcw, Sun, Bookmark, Settings, Compass, LucideIcon } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    lang: 'en' | 'ar';
    activeColors: any;
}

const MoreMenuSheet = ({ isOpen, onClose, activeTab, setActiveTab, lang, activeColors }: Props) => {
    if (!isOpen) return null;

    const isAr = lang === 'ar';

    const menuItems: MenuItem[] = [
        { id: 'search', label: isAr ? 'البحث' : 'Search', icon: Search },
        { id: 'qibla', label: isAr ? 'القبلة' : 'Qibla', icon: Compass },
        { id: 'hadith', label: isAr ? 'أحاديث' : 'Hadiths', icon: Book },
        { id: 'tasbih', label: isAr ? 'التسبيح' : 'Tasbih', icon: RotateCcw },
        { id: 'adhkar', label: isAr ? 'الأذكار' : 'Adhkar', icon: Sun },
        { id: 'saved', label: isAr ? 'المحفوظات' : 'Saved', icon: Bookmark },
        { id: 'settings', label: isAr ? 'الإعدادات' : 'Settings', icon: Settings },
    ];

    return (
        <View style={styles.sheetOverlay}>
            <TouchableOpacity
                style={styles.sheetClose}
                activeOpacity={1}
                onPress={onClose}
            />
            <View style={[
                styles.bottomSheet,
                { backgroundColor: activeColors.surface }
            ]}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetContent}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.sheetItem,
                                { flexDirection: isAr ? 'row-reverse' : 'row' }
                            ]}
                            onPress={() => {
                                setActiveTab(item.id);
                                onClose();
                            }}
                        >
                            <View style={styles.sheetIconBox}>
                                <item.icon size={22} color={activeTab === item.id ? Colors.secondary : activeColors.textMuted} />
                            </View>
                            <Text style={[
                                styles.sheetText,
                                { textAlign: isAr ? 'right' : 'left', color: activeColors.textMuted },
                                activeTab === item.id && styles.activeSheetText
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sheetOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        justifyContent: 'flex-end',
    },
    sheetClose: {
        flex: 1,
    },
    bottomSheet: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'android' ? 40 : 30,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 20,
    },
    sheetHandle: {
        width: 50,
        height: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetContent: {
        width: '100%',
    },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginBottom: 5,
    },
    sheetIconBox: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    sheetText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
    },
    activeSheetText: {
        color: Colors.secondary,
        fontWeight: 'bold',
    },
});

export default MoreMenuSheet;
