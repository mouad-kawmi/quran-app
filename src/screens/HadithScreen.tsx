import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Platform, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { fetchHadiths } from '../api/quranApi';
import { Translations } from '../constants/Translations';
import { Star } from 'lucide-react-native';

const CATEGORIES = [
    { id: 'all', ar: 'الكل', en: 'All' },
    { id: 'faith', ar: 'الإيمان', en: 'Faith' },
    { id: 'prayer', ar: 'الصلاة', en: 'Prayer' },
    { id: 'fasting', ar: 'الصوم', en: 'Fasting' },
    { id: 'ethics', ar: 'الأخلاق', en: 'Ethics' },
    { id: 'knowledge', ar: 'العلم', en: 'Knowledge' },
];

const HadithScreen = ({ lang, theme }: any) => {
    const [allHadiths, setAllHadiths] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        loadHadiths();
    }, []);

    const loadHadiths = async () => {
        try {
            const data = await fetchHadiths();
            const list = Array.isArray(data) ? data : ((data as any).ahadith || []);

            // Respect the categories from the data source
            const categorizedList = list.map((h: any, index: number) => ({
                ...h,
                id: h.id || index.toString(),
                category: h.category || 'ethics'
            }));

            setAllHadiths(categorizedList);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const hadithOfTheDay = useMemo(() => {
        if (allHadiths.length === 0) return null;
        // Selection based on current date (day of year approximately)
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        return allHadiths[dayOfYear % allHadiths.length];
    }, [allHadiths]);

    const filteredHadiths = useMemo(() => {
        if (selectedCategory === 'all') return allHadiths;
        return allHadiths.filter(h => h.category === selectedCategory);
    }, [allHadiths, selectedCategory]);

    const handleShare = async (item: any) => {
        try {
            await Share.share({
                message: `${item.ar}\n\n${item.en}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors.secondary }]}>
                    {lang === 'ar' ? 'الأحاديث النبوية' : 'Prophetic Hadiths'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hadith Of The Day */}
                {hadithOfTheDay && (
                    <View style={[styles.featuredCard, { backgroundColor: Colors.secondary }]}>
                        <View style={styles.featuredHeader}>
                            <Star size={20} color="#081C15" fill="#081C15" />
                            <Text style={styles.featuredTitle}>
                                {lang === 'ar' ? 'حديث اليوم' : 'Hadith of the Day'}
                            </Text>
                        </View>
                        <Text style={styles.featuredAr}>{hadithOfTheDay.ar}</Text>
                        <Text style={styles.featuredEn}>{hadithOfTheDay.en}</Text>
                        <TouchableOpacity
                            style={styles.featuredShare}
                            onPress={() => handleShare(hadithOfTheDay)}
                        >
                            <Text style={styles.featuredShareText}>
                                {lang === 'ar' ? 'مشاركة البركة' : 'Share Blessing'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryContent}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryBtn,
                                { backgroundColor: selectedCategory === cat.id ? Colors.secondary : activeColors.surface },
                                selectedCategory === cat.id && styles.activeCategoryBtn
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: selectedCategory === cat.id ? '#081C15' : activeColors.textMuted }
                            ]}>
                                {lang === 'ar' ? cat.ar : cat.en}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Hadith List */}
                <View style={styles.listSection}>
                    {filteredHadiths.map((item, index) => (
                        <View key={index} style={[styles.card, { backgroundColor: activeColors.surface }]}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.catBadge, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
                                    <Text style={styles.catBadgeText}>
                                        {lang === 'ar'
                                            ? CATEGORIES.find(c => c.id === item.category)?.ar
                                            : CATEGORIES.find(c => c.id === item.category)?.en}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.arabicText, { color: activeColors.text }]}>{item.ar}</Text>
                            <Text style={[styles.translationText, { color: activeColors.textMuted }]}>{item.en}</Text>
                            <TouchableOpacity
                                style={styles.shareButton}
                                onPress={() => handleShare(item)}
                            >
                                <Text style={{ color: Colors.secondary, fontWeight: 'bold' }}>
                                    {lang === 'ar' ? 'مشاركة' : 'Share'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    {filteredHadiths.length === 0 && (
                        <Text style={[styles.emptyText, { color: activeColors.textMuted }]}>
                            {lang === 'ar' ? 'لا توجد أحاديث في هذا القسم حالياً' : 'No hadiths in this section yet'}
                        </Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 10 },
    title: { fontSize: 24, fontWeight: 'bold' },

    featuredCard: {
        margin: 16,
        padding: 20,
        borderRadius: 20,
        elevation: 5,
        shadowColor: Colors.secondary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    featuredHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    featuredTitle: {
        color: '#081C15',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    featuredAr: {
        color: '#081C15',
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'right',
        fontWeight: '600',
    },
    featuredEn: {
        color: '#081C15',
        fontSize: 14,
        marginTop: 10,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    featuredShare: {
        marginTop: 15,
        backgroundColor: 'rgba(8, 28, 21, 0.1)',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    featuredShareText: {
        color: '#081C15',
        fontWeight: 'bold',
    },

    categoryScroll: {
        marginBottom: 10,
    },
    categoryContent: {
        paddingHorizontal: 16,
        paddingBottom: 5,
    },
    categoryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        marginRight: 10,
    },
    activeCategoryBtn: {
        elevation: 3,
    },
    categoryText: {
        fontWeight: '600',
        fontSize: 14,
    },

    listSection: {
        padding: 16,
    },
    card: {
        padding: 20,
        borderRadius: 15,
        marginBottom: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    catBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    catBadgeText: {
        color: Colors.secondary,
        fontSize: 11,
        fontWeight: 'bold',
    },
    arabicText: {
        fontSize: 18,
        lineHeight: 32,
        textAlign: 'right',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'Traditional Arabic' : 'serif',
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
    },
    shareButton: {
        marginTop: 15,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.secondary,
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
    }
});

export default HadithScreen;
