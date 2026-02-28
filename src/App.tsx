import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Alert, SafeAreaView, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Colors } from './constants/Colors';
import { Storage } from './utils/storage';
import { NotificationService } from './utils/notificationService';
import { checkForUpdates } from './utils/updateManager';
import { useAppSettings } from './hooks/useAppSettings';

// Navigation
import BottomTabNav from './components/navigation/BottomTabNav';
import MoreMenuSheet from './components/navigation/MoreMenuSheet';
import Navigator from './navigation/Navigator';
import AnimatedSplashScreen from './components/common/AnimatedSplashScreen';
import Onboarding from './components/common/Onboarding';

// Notification Setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const { lang, theme, reciter, setReciter, toggleLanguage, toggleTheme } = useAppSettings();
  const [activeTab, setActiveTab] = useState<any>('quran');
  const [screen, setScreen] = useState<'list' | 'detail' | 'khatma_reader'>('list');
  const [selectedSurah, setSelectedSurah] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [homeRefresh, setHomeRefresh] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Khatma State
  const [khatma, setKhatma] = useState<any>({ isStarted: false, currentDay: 1, totalDays: 30, history: [], juzs: [] });

  useEffect(() => {
    const init = async () => {
      await NotificationService.registerForNotifications();
      const savedKhatma = await Storage.getKhatma();
      if (savedKhatma) setKhatma({ ...khatma, ...savedKhatma });
      checkForUpdates(lang);

      const onboardingDone = await Storage.isOnboardingCompleted();
      setShowOnboarding(!onboardingDone);
    };
    init();
  }, []);

  useEffect(() => { Storage.saveKhatma(khatma); }, [khatma]);
  useEffect(() => { NotificationService.scheduleAll(lang); }, [lang]);

  useEffect(() => {
    const onBack = () => {
      if (isMenuOpen) { setIsMenuOpen(false); return true; }
      if (screen !== 'list') { setScreen('list'); setHomeRefresh(Date.now()); return true; }
      if (activeTab !== 'quran') { setActiveTab('quran'); return true; }
      return false;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => handler.remove();
  }, [screen, isMenuOpen, activeTab]);

  const onSelectSurah = (number: number, name: string, arName: string, start?: number) => {
    setSelectedSurah({ number, name, arabicName: arName, startAyah: start });
    setScreen('detail');
  };

  const handleCompletePortion = () => {
    const newHistory = [...khatma.history, new Date().toDateString()];
    const nextDay = khatma.currentDay < khatma.totalDays ? khatma.currentDay + 1 : khatma.totalDays + 1;
    setKhatma({ ...khatma, history: newHistory, currentDay: nextDay });
    if (screen === 'khatma_reader') setScreen('list');
    setActiveTab('khatma');
    Alert.alert(lang === 'ar' ? "تقبل الله!" : "Taqabbala Allah!");
  };

  const activeColors = theme === 'dark' ? Colors.dark : Colors.light;

  if (showSplash) {
    return <AnimatedSplashScreen lang={lang} onAnimationComplete={() => setShowSplash(false)} />;
  }

  if (showOnboarding) {
    return (
      <Onboarding
        lang={lang}
        onFinish={async () => {
          await Storage.setOnboardingCompleted(true);
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: activeColors.background }}>
        <MoreMenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} activeColors={activeColors} />
        <SafeAreaView style={{ flex: 1 }}>
          <Navigator activeTab={activeTab} currentScreen={screen} selectedSurah={selectedSurah} lang={lang} theme={theme} reciter={reciter} setReciter={setReciter}
            onBack={() => { setScreen('list'); setHomeRefresh(Date.now()); }} onSelectSurah={onSelectSurah} homeRefreshTrigger={homeRefresh}
            khatmaState={{ ...khatma, currentJuzSelection: khatma.juzs }} onStartKhatmaReading={(juzs) => { setKhatma({ ...khatma, juzs }); setScreen('khatma_reader'); }}
            onCompletePortion={handleCompletePortion} onSetKhatmaPlan={(days) => setKhatma({ isStarted: days > 0, currentDay: 1, totalDays: days, history: [], juzs: [] })}
            toggleLanguage={toggleLanguage} toggleTheme={toggleTheme} />
          {screen === 'list' && <BottomTabNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} activeColors={activeColors} onMorePress={() => setIsMenuOpen(true)} />}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
