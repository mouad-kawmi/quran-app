import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Search, Calendar, Moon } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    greeting: string;
    gregorianDate: string;
    hijriDate: string;
    title: string;
    searchQuery: string;
    setSearchQuery: (text: string) => void;
    onSearch: (text: string) => void;
    placeholder: string;
    activeColors: any;
    onDatePress?: () => void;
}

/**
 * Header component for the home screen containing greeting, date and search bar.
 */
const HomeHeader = ({
    greeting,
    gregorianDate,
    hijriDate,
    title,
    searchQuery,
    setSearchQuery,
    onSearch,
    placeholder,
    activeColors,
    onDatePress
}: Props) => {
    return (
        <View style={[styles.header, { backgroundColor: activeColors.background }]}>
            <View style={styles.topSection}>
                <Text style={[styles.greeting, { color: activeColors.textMuted }]}>{greeting}</Text>

                <TouchableOpacity activeOpacity={0.8} onPress={onDatePress} style={styles.dateHorizontalScroll}>
                    <View style={[styles.dateBadge, { backgroundColor: activeColors.surface }]}>
                        <Calendar size={12} color={Colors.secondary} />
                        <Text style={[styles.dateText, { color: activeColors.text }]}>{gregorianDate}</Text>
                    </View>

                    <View style={styles.verticalDivider} />

                    <View style={[styles.dateBadge, { backgroundColor: activeColors.surface }]}>
                        <Moon size={12} color={Colors.secondary} />
                        <Text style={[styles.dateText, { color: activeColors.text }]}>{hijriDate}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: activeColors.text }]}>{title}</Text>

            <View style={[styles.searchWrapper, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                <Search size={20} color={Colors.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: activeColors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={activeColors.textMuted}
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        onSearch(text);
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 22,
        paddingBottom: 25,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 20,
    },
    topSection: {
        marginBottom: 15,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    dateHorizontalScroll: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    verticalDivider: {
        width: 1,
        height: 15,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        marginHorizontal: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        paddingHorizontal: 18,
        height: 56,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
});

export default HomeHeader;
