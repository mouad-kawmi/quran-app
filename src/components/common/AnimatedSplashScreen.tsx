import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, StatusBar } from 'react-native';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface Props {
    onAnimationComplete: () => void;
    lang: 'en' | 'ar';
}

const AnimatedSplashScreen = ({ onAnimationComplete, lang }: Props) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const textFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        // Text Animation (after logo)
        setTimeout(() => {
            Animated.timing(textFadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }, 500);

        // Transition out
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }).start(onAnimationComplete);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const isAr = lang === 'ar';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
                <Text style={styles.appName}>آيات - القرآن الكريم</Text>
                <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Version 1.1.1 Premium</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        elevation: 10,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.white,
        marginBottom: 8,
    },
    bismillah: {
        fontSize: 18,
        color: Colors.secondary,
        fontFamily: 'serif',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        letterSpacing: 1,
    }
});

export default AnimatedSplashScreen;
