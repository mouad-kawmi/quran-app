import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Storage } from '../utils/storage';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { Trash2 } from 'lucide-react-native';

interface Props {
    onSelectBookmark: (surahNumber: number, surahName: string, ayahNumber: number) => void;
    lang: string;
    theme: 'dark' | 'light';
}

const SavedScreen = ({ onSelectBookmark, lang, theme }: Props) => {
    const t = Translations[lang];
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        loadBookmarks();
    }, []);

    const loadBookmarks = async () => {
        const data = await Storage.getBookmarks();
        setBookmarks(data);
    };

    const handleRemove = async (surahNumber: number, ayahNumber: number) => {
        const data = await Storage.getBookmarks();
        const filtered = data.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
        await Storage.saveBookmarks(filtered);
        setBookmarks(filtered);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.title, { color: Colors.secondary }]}>{t.saved}</Text>
            </View>

            <FlatList
                data={bookmarks}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: activeColors.surface }]}>
                        <TouchableOpacity
                            style={styles.cardContent}
                            onPress={() => onSelectBookmark(item.surahNumber, item.surahName, item.ayahNumber)}
                        >
                            <Text style={[styles.surahName, { color: Colors.secondary }]}>
                                {item.surahName} - {lang === 'ar' ? 'آية' : 'Ayah'} {item.ayahNumber}
                            </Text>
                            <Text style={[styles.ayahText, { color: activeColors.text }]} numberOfLines={2}>
                                {item.text}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleRemove(item.surahNumber, item.ayahNumber)} style={{ padding: 5 }}>
                            <Trash2 size={20} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Text style={{ color: activeColors.textMuted }}>{t.noBookmarks}</Text>
                    </View>
                )}
                contentContainerStyle={{ padding: 16 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
    card: { padding: 16, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    cardContent: { flex: 1 },
    surahName: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
    ayahText: { fontSize: 16, textAlign: 'right' },
    empty: { flex: 1, alignItems: 'center', marginTop: 100 }
});

export default SavedScreen;
