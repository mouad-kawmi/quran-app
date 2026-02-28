import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Animated, Dimensions } from 'react-native';
import { BookOpen, Calendar, Mic, MapPin, ChevronRight, Check } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to Ayaat',
        titleAr: 'مرحبا بك في آيات',
        description: 'Explore the Holy Quran with a premium reading experience designed for your spiritual journey.',
        descriptionAr: 'اكتشف القرآن الكريم بتجربة قراءة فاخرة مصممة لرحلتك الروحية.',
        icon: BookOpen,
        color: '#D4AF37',
    },
    {
        id: '2',
        title: 'Spiritual Growth',
        titleAr: 'نمو روحي',
        description: 'Track your Khatma progress, set personal goals, and never miss your daily portion.',
        descriptionAr: 'تتبع تقدمك في الختمة، حدد أهدافك الشخصية، ولا تفوت وردك اليومي أبدًا.',
        icon: Calendar,
        color: '#74C69D',
    },
    {
        id: '3',
        title: 'Listen Anywhere',
        titleAr: 'استمع في كل مكان',
        description: 'Choose from world-renowned reciters and download surahs for offline listening.',
        descriptionAr: 'اختر من بين أشهر القراء في العالم وحمل السور للاستماع بدون إنترنت.',
        icon: Mic,
        color: '#D4AF37',
    },
    {
        id: '4',
        title: 'Stay Connected',
        titleAr: 'ابق على اتصال',
        description: 'Access accurate prayer times and Qibla direction wherever you are in the world.',
        descriptionAr: 'احصل على مواقيت الصلاة بدقة واتجاه القبلة أينما كنت في العالم.',
        icon: MapPin,
        color: '#74C69D',
    },
];

interface Props {
    onFinish: () => void;
    lang: 'en' | 'ar';
}

const Onboarding = ({ onFinish, lang }: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        setCurrentIndex(viewableItems[0].index);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            onFinish();
        }
    };

    const isAr = lang === 'ar';

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        const Icon = item.icon;
        return (
            <View style={styles.slide}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                    <Icon color={item.color} size={100} strokeWidth={1.5} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{isAr ? item.titleAr : item.title}</Text>
                    <Text style={styles.description}>{isAr ? item.descriptionAr : item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 3 }}>
                <FlatList
                    data={SLIDES}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                    inverted={isAr}
                />
            </View>

            <View style={styles.footer}>
                <View style={styles.paginator}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                style={[styles.dot, { width: dotWidth, opacity }]}
                                key={i.toString()}
                            />
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.button} onPress={scrollTo} activeOpacity={0.8}>
                    <View style={[styles.buttonTextContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.buttonText}>
                            {currentIndex === SLIDES.length - 1
                                ? (isAr ? 'ابدأ الآن' : 'Get Started')
                                : (isAr ? 'التالي' : 'Next')}
                        </Text>
                        {currentIndex === SLIDES.length - 1
                            ? <Check color={Colors.white} size={20} style={{ marginHorizontal: 8 }} />
                            : <ChevronRight color={Colors.white} size={20} style={{ marginHorizontal: 8, transform: [{ scaleX: isAr ? -1 : 1 }] }} />
                        }
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        width,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 250,
        height: 250,
        borderRadius: 125,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.secondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    description: {
        fontSize: 18,
        color: Colors.dark.textMuted,
        textAlign: 'center',
        lineHeight: 26,
    },
    footer: {
        height: height * 0.25,
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingBottom: 40,
        width: '100%',
    },
    paginator: {
        flexDirection: 'row',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.secondary,
        marginHorizontal: 8,
    },
    button: {
        backgroundColor: Colors.secondary,
        paddingVertical: 18,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: Colors.secondary,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
    buttonTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
    },
});

export default Onboarding;
