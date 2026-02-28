import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');
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
            <View style={styles.mushafPageFrame}>
                {item.ayahs[0].ns === 1 && (
                    <View style={styles.surahBanner}>
                        <View style={styles.bannerBorder}>
                            <Text style={styles.surahTitle}>{arabicName}</Text>
                        </View>
                        {number !== 1 && number !== 9 && (
                            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                        )}
                    </View>
                )}

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
    pageContainer: {
        marginBottom: 40,
        paddingHorizontal: 1,
        minHeight: height * 0.72,
    },
    mushafPageFrame: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.15)',
        borderRadius: 8,
        padding: 16,
        paddingTop: 24,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    surahBanner: {
        alignItems: 'center',
        marginBottom: 2,
    },
    bannerBorder: {
        borderWidth: 1,
        borderColor: Colors.secondary,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 4,
        borderStyle: 'dashed',
        marginBottom: 15,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    surahTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: Colors.secondary,
        fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
        textAlign: 'center',
    },
    bismillah: {
        fontSize: 26,
        textAlign: 'center',
        color: Colors.secondary,
        fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
        marginTop: 5,
        letterSpacing: 1,
    },
    mushafText: {
        textAlign: 'justify',
        writingDirection: 'rtl',
    },
    arabicText: {
        fontSize: 27,
        lineHeight: 52,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
    },
    marker: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    pageNumber: {
        textAlign: 'center',
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.6,
    },
});

export default MushafPage;
