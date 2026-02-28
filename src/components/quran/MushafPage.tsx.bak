import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

interface Props {
    item: any;
    arabicName: string;
    number: number;
    activeColors: any;
    playingAyah: number | null;
    bookmarks: any[];
    onAyahPress: (ayah: any) => void;
}

const MushafPage = ({ item, arabicName, number, activeColors, playingAyah, bookmarks, onAyahPress }: Props) => {
    return (
        <View style={styles.pageContainer}>
            {item.ayahs[0].ns === 1 && (
                <View style={styles.surahDivider}>
                    <Text style={[styles.surahTitle, { color: Colors.secondary }]}>{arabicName}</Text>
                    {number !== 1 && number !== 9 && (
                        <Text style={[styles.bismillah, { color: Colors.secondary }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                    )}
                </View>
            )}

            <View style={styles.mushafPageFrame}>
                <Text style={[styles.mushafText, { color: activeColors.text }]}>
                    {item.ayahs.map((ayah: any) => {
                        const isPlaying = playingAyah === ayah.n;
                        const isBookmarked = bookmarks.some(b => b.surahNumber === number && b.ayahNumber === ayah.ns);

                        return (
                            <Text key={ayah.n} onPress={() => onAyahPress(ayah)}>
                                <Text style={[
                                    styles.arabicText,
                                    {
                                        color: isPlaying ? Colors.secondary : (isBookmarked ? Colors.accent : activeColors.text),
                                        backgroundColor: isPlaying ? Colors.secondary + '20' : 'transparent'
                                    }
                                ]}>
                                    {ayah.t}
                                </Text>
                                <Text style={[styles.marker, { color: Colors.secondary }]}>
                                    {" "}({ayah.ns}){" "}
                                </Text>
                            </Text>
                        );
                    })}
                </Text>
            </View>
            <Text style={[styles.pageNumber, { color: activeColors.textMuted }]}>{item.page}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    pageContainer: { marginBottom: 60 },
    surahDivider: { alignItems: 'center', marginTop: 20, marginBottom: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 175, 55, 0.1)', paddingBottom: 25 },
    surahTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
    bismillah: { fontSize: 26, textAlign: 'center' },
    mushafPageFrame: { paddingHorizontal: 5 },
    mushafText: { textAlign: 'right', writingDirection: 'rtl' },
    arabicText: { fontSize: 26, lineHeight: 62, fontWeight: '500', fontFamily: Platform.OS === 'android' ? 'serif' : 'System' },
    marker: { fontSize: 18, fontWeight: 'bold' },
    pageNumber: { textAlign: 'center', marginTop: 25, fontSize: 13, fontWeight: 'bold', opacity: 0.4 },
});

export default MushafPage;
