import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ScrollView, BackHandler, ActivityIndicator } from 'react-native';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { RemoteContentService } from '../api/remoteContent';

const ADHKAR_CATEGORIES = [
    {
        id: 'sabah',
        title: 'أذكار الصباح',
        subtitle: 'Morning Adhkar',
        items: [
            { id: '1', text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1, hadith: 'كان النبي صلى الله عليه وسلم إذا أصبح قال ذلك.' },
            { id: '2', text: 'اللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ', count: 1, hadith: 'من قالها حين يصبح أجير من الجن حتى يمسي.' },
            { id: '3', text: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللَّهُ أَحَدٌ... (المعوذات)', count: 3, hadith: 'من قالها ثلاثاً حين يصبح وحين يمسي كفته من كل شيء.' },
        ]
    },
    {
        id: 'masa',
        title: 'أذكار المساء',
        subtitle: 'Evening Adhkar',
        items: [
            { id: 'm1', text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1, hadith: 'من السنة الثابتة عنه صلى الله عليه وسلم عشيّة.' },
            { id: 'm2', text: 'اللّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', count: 1, hadith: 'كان النبي يعلم أصحابه يقولون ذلك في المساء.' },
        ]
    },
    {
        id: 'after_prayer',
        title: 'أذكار بعد الصلاة',
        subtitle: 'After Prayer Adhkar',
        items: [
            { id: 'ap1', text: 'أستغفر الله (ثلاثاً) .. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام', count: 1, hadith: 'كان رسول الله إذا انصرف من صلاته استغفر ثلاثاً وقاله.' },
            { id: 'ap2', text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', count: 1, hadith: 'من قال ذلك في دبر كل صلاة لم يخب.' },
        ]
    },
    {
        id: 'exit_home',
        title: 'أذكار الخروج من المنزل',
        subtitle: 'Leaving Home Adhkar',
        items: [
            { id: 'h1', text: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلا حَوْلَ وَلا قُوَّةَ إِلاَّ بِاللَّهِ', count: 1, hadith: 'يقال له: هديت وكفيت ووقيت، وتنحى عنه الشيطان.' },
        ]
    },
    {
        id: 'sleep',
        title: 'أذكار النوم',
        subtitle: 'Sleep Adhkar',
        items: [
            { id: 's1', text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ', count: 1 },
            { id: 's2', text: 'اللهم قني عذابك يوم تبعث عبادك (ثلاثاً)', count: 3 },
            { id: 's3', text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', count: 1 },
        ]
    },
];

interface Props {
    lang: string;
    theme: 'dark' | 'light';
}

const AdhkarScreen = ({ lang, theme }: Props) => {
    const t = Translations[lang];
    const [categories, setCategories] = useState<any[]>(ADHKAR_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<any>({});
    const isDark = theme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    useEffect(() => {
        loadRemoteAdhkar();
    }, []);

    const loadRemoteAdhkar = async () => {
        try {
            const remote = await RemoteContentService.getAdhkar();
            if (remote && remote.length > 0) {
                setCategories(remote);
            }
        } catch (e) {
            console.log("Error loading remote adhkar", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const backAction = () => {
            if (selectedCategory) {
                setSelectedCategory(null);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [selectedCategory]);

    const handlePressAdhkar = (adhkarId: string, maxCount: number) => {
        const currentCount = counts[adhkarId] || 0;
        if (currentCount < maxCount) {
            setCounts({ ...counts, [adhkarId]: currentCount + 1 });
        }
    };

    if (loading && categories.length === 0) {
        return (
            <View style={[styles.center, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    if (selectedCategory) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
                <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                    <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backButton}>
                        <Text style={[styles.backText, { color: Colors.secondary }]}>{lang === 'ar' ? '⬅ رجوع' : '⬅ Back'}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: Colors.secondary }]}>{selectedCategory.title}</Text>
                    <View style={{ width: 50 }} />
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {selectedCategory.items.map((item: any) => {
                        const currentCount = counts[item.id] || 0;
                        const isDone = currentCount >= item.count;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.8}
                                style={[
                                    styles.adhkarCard,
                                    { backgroundColor: activeColors.surface, borderLeftColor: isDone ? Colors.accent : Colors.secondary },
                                    isDone && styles.adhkarCardDone
                                ]}
                                onPress={() => handlePressAdhkar(item.id, item.count)}
                            >
                                <View style={styles.adhkarHeader}>
                                    <TouchableOpacity style={styles.playBtn}>
                                        <Text style={{ fontSize: 16 }}>▶️</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.adhkarText, { color: activeColors.text }]}>{item.text}</Text>
                                {item.hadith && (
                                    <View style={[styles.hadithContainer, { backgroundColor: Colors.secondary + '10' }]}>
                                        <Text style={[styles.hadithText, { color: activeColors.textMuted }]}>
                                            {item.hadith}
                                        </Text>
                                    </View>
                                )}
                                <View style={[styles.adhkarFooter, { borderTopColor: activeColors.border }]}>
                                    <Text style={[styles.countText, { color: Colors.secondary }]}>{currentCount} / {item.count}</Text>
                                    {isDone && <Text style={[styles.doneLabel, { color: Colors.accent }]}>{lang === 'ar' ? 'تم ✅' : 'Done ✅'}</Text>}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.headerTitle, { color: Colors.secondary }]}>{t.adhkar}</Text>
            </View>
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.categoryCard, { backgroundColor: activeColors.surface }]}
                        onPress={() => {
                            setSelectedCategory(item);
                            setCounts({}); // Reset counts when entering new category
                        }}
                    >
                        <View>
                            <Text style={[styles.categoryTitle, { color: activeColors.text }]}>{lang === 'ar' ? item.title : item.subtitle}</Text>
                            <Text style={[styles.categorySubtitle, { color: Colors.accent }]}>{lang === 'ar' ? "أذكار يومية" : "Daily Reminders"}</Text>
                        </View>
                        <Text style={styles.arrowIcon}>{lang === 'ar' ? '⬅️' : '➡️'}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 16 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    backButton: { padding: 5 },
    backText: { fontSize: 16 },
    listContent: { padding: 16 },
    categoryCard: { padding: 25, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
    categoryTitle: { fontSize: 18, fontWeight: 'bold' },
    categorySubtitle: { fontSize: 12, marginTop: 4 },
    arrowIcon: { fontSize: 20 },
    adhkarCard: { padding: 20, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    adhkarCardDone: { opacity: 0.8 },
    adhkarHeader: { marginBottom: 10, alignItems: 'flex-start' },
    playBtn: { padding: 5 },
    adhkarText: { fontSize: 20, textAlign: 'right', lineHeight: 35 },
    adhkarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, paddingTop: 10 },
    countText: { fontWeight: 'bold', fontSize: 16 },
    doneLabel: { fontWeight: 'bold' },
    hadithContainer: { marginTop: 15, padding: 12, borderRadius: 10, borderRightWidth: 3, borderRightColor: Colors.secondary },
    hadithText: { fontSize: 13, fontStyle: 'italic', textAlign: 'right', lineHeight: 20 },
});

export default AdhkarScreen;
