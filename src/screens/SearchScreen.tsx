import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { searchQuran } from '../api/quranApi';
import { Colors } from '../constants/Colors';
import { Translations } from '../constants/Translations';
import { Search } from 'lucide-react-native';

interface Props {
    lang: string;
    theme: 'dark' | 'light';
    onSelectAyah: (surahNumber: number, surahName: string, ayahNumber: number) => void;
}

const SearchScreen = ({ lang, theme, onSelectAyah }: Props) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const t = Translations[lang];
    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    const handleSearch = async (text: string) => {
        const cleanText = text.trim();
        // Require at least 3 characters to avoid generic results like "ال" or "الم"
        if (!cleanText || cleanText.length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const data = await searchQuran(cleanText);
            const normalizedQuery = cleanText.replace(/[ًٌٍَُِّْٰ]/g, '');

            // 1. Separate results into Exact and Partial matches
            const exactMatches: any[] = [];
            const partialMatches: any[] = [];

            data.forEach(item => {
                const normalizedText = item.text.replace(/[ًٌٍَُِّْٰ]/g, '');

                // Regex for exact word match in Arabic (boundaries: start/end of string, spaces, or punctuation)
                // We use [^\u0621-\u064A] to match anything that is NOT an Arabic letter
                const boundaryRegex = new RegExp(`(^|[^\\u0621-\\u064A])${normalizedQuery}([^\\u0621-\\u064A]|$)`, 'i');

                if (boundaryRegex.test(normalizedText)) {
                    exactMatches.push(item);
                } else if (normalizedText.includes(normalizedQuery)) {
                    partialMatches.push(item);
                }
            });

            // 2. Prioritize Exact Matches
            // If we have exact whole-word matches, only show those.
            // If not, show partial matches.
            const finalResults = exactMatches.length > 0 ? exactMatches : partialMatches;
            setResults(finalResults.slice(0, 40));

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }

    };


    React.useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleSearch(query);
        }, 600); // 600ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
                    <TextInput
                        style={[styles.input, { color: activeColors.text, textAlign: lang === 'ar' ? 'right' : 'left' }]}
                        placeholder={lang === 'ar' ? 'بحث في الآيات...' : 'Search verses...'}
                        placeholderTextColor={activeColors.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={() => handleSearch(query)}
                        returnKeyType="search"
                    />
                    <TouchableOpacity onPress={() => handleSearch(query)} style={{ padding: 5 }}>
                        <Search size={22} color={Colors.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator color={Colors.secondary} /></View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.resultCard, { backgroundColor: activeColors.surface }]}
                            onPress={() => onSelectAyah(item.surah.number, item.surah.englishName, item.numberInSurah)}
                        >
                            <View style={{ flexDirection: lang === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={[styles.surahInfo, { color: Colors.secondary }]}>
                                    {item.surah.name} ({item.surah.englishName})
                                </Text>
                                <Text style={[styles.ayahNumber, { color: Colors.accent }]}>
                                    {lang === 'ar' ? 'آية' : 'Ayah'} {item.numberInSurah}
                                </Text>
                            </View>
                            <Text style={[styles.ayahText, { color: activeColors.text, textAlign: 'right' }]}>{item.text}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={() => (
                        <View style={styles.center}>
                            <Text style={[{ color: activeColors.textMuted, textAlign: 'center' }]}>
                                {query.length > 0 && query.length < 3
                                    ? (lang === 'ar' ? 'اكتب 3 أحرف على الأقل للبحث...' : 'Type at least 3 characters to search...')
                                    : query.length >= 3
                                        ? (lang === 'ar' ? 'لا توجد نتائج' : 'No results found')
                                        : (lang === 'ar' ? 'ابدأ البحث عن أي كلمة في القرآن' : 'Start searching for any word in Quran')}
                            </Text>
                        </View>
                    )}

                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 15 },
    searchBar: { borderRadius: 12, paddingHorizontal: 15, height: 50, flexDirection: 'row', alignItems: 'center' },
    input: { flex: 1, fontSize: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    resultCard: { padding: 18, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
    surahInfo: { fontSize: 14, fontWeight: 'bold' },
    ayahNumber: { fontSize: 12, fontWeight: '600' },
    ayahText: { fontSize: 18, lineHeight: 32, marginTop: 5 },
});

export default SearchScreen;
