import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BookOpen, Compass, Calendar, Menu, LucideIcon } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface Props {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    lang: 'en' | 'ar';
    activeColors: any;
    onMorePress: () => void;
}

const BottomTabNav = ({ activeTab, setActiveTab, lang, activeColors, onMorePress }: Props) => {
    const isAr = lang === 'ar';

    const tabs: NavItem[] = [
        { id: 'quran', label: isAr ? 'اليوم' : 'Today', icon: BookOpen },
        { id: 'prayer', label: isAr ? 'القبلة' : 'Qibla', icon: Compass },
        { id: 'khatma', label: isAr ? 'الختمة' : 'Khatma', icon: Calendar },
        { id: 'more', label: isAr ? 'المزيد' : 'More', icon: Menu },
    ];

    return (
        <View style={[
            styles.bottomNav,
            {
                backgroundColor: activeColors.surface,
                borderTopColor: activeColors.border,
                flexDirection: isAr ? 'row-reverse' : 'row'
            }
        ]}>
            {tabs.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.bottomNavItem}
                    onPress={() => {
                        if (item.id === 'more') {
                            onMorePress();
                        } else {
                            setActiveTab(item.id);
                        }
                    }}
                >
                    <item.icon
                        size={24}
                        color={activeTab === item.id ? Colors.secondary : activeColors.textMuted}
                    />
                    <Text style={[
                        styles.bottomNavText,
                        { color: activeTab === item.id ? Colors.secondary : activeColors.textMuted }
                    ]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        height: Platform.OS === 'android' ? 85 : 70,
        flexDirection: 'row',
        borderTopWidth: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'android' ? 20 : 5,
    },
    bottomNavItem: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomNavText: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
});

export default BottomTabNav;
