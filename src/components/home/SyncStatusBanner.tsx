import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface Props {
    isSyncing: boolean;
    syncProgress: number;
    lang: string;
    activeColors: any;
}

/**
 * Small banner that shows the progress of downloading Quran data for offline use.
 */
const SyncStatusBanner = ({ isSyncing, syncProgress, lang, activeColors }: Props) => {
    if (!isSyncing) return null;

    return (
        <View style={[styles.container, { backgroundColor: activeColors.surface }]}>
            <View style={styles.header}>
                <Text style={[styles.text, { color: activeColors.text }]}>
                    {lang === 'ar' ? 'جاري تحميل القرآن...' : 'Downloading Quran...'}
                </Text>
                <Text style={[styles.percent, { color: Colors.secondary }]}>
                    {syncProgress}%
                </Text>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: activeColors.surfaceLight }]}>
                <View
                    style={[
                        styles.progressBarFill,
                        { width: `${syncProgress}%`, backgroundColor: Colors.secondary }
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 15,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.secondary
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    text: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1
    },
    percent: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 10
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3
    },
});

export default SyncStatusBanner;
