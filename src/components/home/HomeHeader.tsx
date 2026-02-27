import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform, StatusBar } from 'react-native';
import { Search } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface Props {
    greeting: string;
    hijriDate: string;
    title: string;
    searchQuery: string;
    setSearchQuery: (text: string) => void;
    onSearch: (text: string) => void;
    placeholder: string;
    activeColors: any;
}

/**
 * Header component for the home screen containing greeting, date and search bar.
 */
const HomeHeader = ({
    greeting,
    hijriDate,
    title,
    searchQuery,
    setSearchQuery,
    onSearch,
    placeholder,
    activeColors
}: Props) => {
    return (
        <View style={styles.header}>
            <View style={styles.topRow}>
                <Text style={[styles.greeting, { color: activeColors.textMuted }]}>{greeting}</Text>
                <Text style={[styles.hijriDate, { color: Colors.secondary }]}>{hijriDate}</Text>
            </View>

            <Text style={[styles.title, { color: activeColors.text }]}>{title}</Text>

            <View style={[styles.searchContainer, { backgroundColor: activeColors.surface }]}>
                <Search size={20} color={activeColors.textMuted} />
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
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    greeting: {
        fontSize: 13,
        fontWeight: '500'
    },
    hijriDate: {
        fontSize: 13,
        fontWeight: 'bold'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10
    },
});

export default HomeHeader;
