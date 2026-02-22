import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, SafeAreaView, StatusBar, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import {
  BookOpen,
  Search,
  Calendar,
  Compass,
  Settings,
  Bookmark,
  RotateCcw,
  Sun,
  Menu,
  X,
  Book
} from 'lucide-react-native';

// Screens
import HomeScreen from './screens/HomeScreen';
import SurahDetailScreen from './screens/SurahDetailScreen';
import TasbihScreen from './screens/TasbihScreen';
import AdhkarScreen from './screens/AdhkarScreen';
import KhatmaScreen from './screens/KhatmaScreen';
import PortionReaderScreen from './screens/PortionReaderScreen';
import PrayerScreen from './screens/PrayerScreen';
import SavedScreen from './screens/SavedScreen';
import SettingsScreen from './screens/SettingsScreen';
import SearchScreen from './screens/SearchScreen';
import HadithScreen from './screens/HadithScreen';
import { Translations } from './constants/Translations';
import { Colors } from './constants/Colors';
import { Storage } from './utils/storage';
import { NotificationService } from './utils/notificationService';

// Navigation Components
import BottomTabNav from './components/navigation/BottomTabNav';
import MoreMenuSheet from './components/navigation/MoreMenuSheet';

type Tab = 'quran' | 'tasbih' | 'adhkar' | 'khatma' | 'prayer' | 'saved' | 'settings' | 'search' | 'hadith';
type Lang = 'en' | 'ar';
type Theme = 'dark' | 'light';

// Configure notifications
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
  const [activeTab, setActiveTab] = useState<Tab>('quran');
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'khatma_reader'>('list');
  const [selectedSurah, setSelectedSurah] = useState<any>(null);
  const [lang, setLang] = useState<Lang>('ar');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [homeRefreshTrigger, setHomeRefreshTrigger] = useState(0);

  const t = Translations[lang];

  // Khatma State
  const [isKhatmaStarted, setIsKhatmaStarted] = useState(false);
  const [currentKhatmaDay, setCurrentKhatmaDay] = useState(1);
  const [totalKhatmaDays, setTotalKhatmaDays] = useState(30);
  const [khatmaHistory, setKhatmaHistory] = useState<string[]>([]);
  const [currentJuzSelection, setCurrentJuzSelection] = useState<number[]>([]);

  useEffect(() => {
    const initApp = async () => {
      await NotificationService.registerForNotifications();
      await loadPersistedData();
      await checkForUpdates();
    };
    initApp();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            lang === 'ar' ? "تحديث جديد" : "Update Available",
            lang === 'ar'
              ? "هناك نسخة جديدة متوفرة. هل تريد التحديث الآن؟"
              : "A new version is available. Would you like to update now?",
            [
              { text: lang === 'ar' ? "لاحقاً" : "Later", style: "cancel" },
              {
                text: lang === 'ar' ? "تحديث" : "Update",
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                }
              }
            ]
          );
        }
      }
    } catch (e) {
      console.log('OTA check error:', e);
    }
  };

  useEffect(() => {
    NotificationService.scheduleAll(lang);
  }, [lang]);

  const loadPersistedData = async () => {
    const savedLang = await Storage.getLang();
    if (savedLang) setLang(savedLang as Lang);

    const savedTheme = await Storage.getTheme();
    if (savedTheme) setTheme(savedTheme as Theme);

    const khatma = await Storage.getKhatma();
    if (khatma) {
      setIsKhatmaStarted(khatma.isStarted);
      setCurrentKhatmaDay(khatma.currentDay);
      setTotalKhatmaDays(khatma.totalDays);
      setKhatmaHistory(khatma.history || []);
    }
  };

  useEffect(() => {
    Storage.saveKhatma({
      isStarted: isKhatmaStarted,
      currentDay: currentKhatmaDay,
      totalDays: totalKhatmaDays,
      history: khatmaHistory
    });
  }, [isKhatmaStarted, currentKhatmaDay, totalKhatmaDays, khatmaHistory]);

  useEffect(() => {
    const backAction = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
        return true;
      }
      if (currentScreen !== 'list') {
        handleBackToList();
        return true;
      }
      if (activeTab !== 'quran') {
        setActiveTab('quran');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentScreen, isMenuOpen, activeTab]);

  const navigateToDetail = (number: number, name: string, arabicName: string, startAyah?: number) => {
    setSelectedSurah({ number, name, arabicName, startAyah });
    setCurrentScreen('detail');
  };

  const handleBackToList = () => {
    setCurrentScreen('list');
    setHomeRefreshTrigger(Date.now());
  };

  const handleStartKhatmaReading = (juzs: number[]) => {
    setCurrentJuzSelection(juzs);
    setCurrentScreen('khatma_reader');
  };

  const handleCompletePortion = () => {
    const today = new Date().toDateString();
    setKhatmaHistory(prev => [...prev, today]);

    if (currentKhatmaDay < totalKhatmaDays) {
      setCurrentKhatmaDay(currentKhatmaDay + 1);
      if (currentScreen === 'khatma_reader') handleBackToList();
      setActiveTab('khatma');
      Alert.alert(lang === 'ar' ? "تقبل الله!" : "Taqabbala Allah!", lang === 'ar' ? "أتممت ورد اليوم بنجاح." : "You completed today's portion.");
    } else {
      setCurrentKhatmaDay(totalKhatmaDays + 1); // Mark as complete
      if (currentScreen === 'khatma_reader') handleBackToList();
    }
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    Storage.saveLang(newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    Storage.saveTheme(newTheme);
  };

  const renderContent = () => {
    if (currentScreen === 'detail' && selectedSurah) {
      return <SurahDetailScreen route={{ params: selectedSurah }} onBack={handleBackToList} lang={lang} theme={theme} />;
    }

    if (currentScreen === 'khatma_reader') {
      return (
        <PortionReaderScreen
          juzList={currentJuzSelection}
          onComplete={handleCompletePortion}
          onBack={handleBackToList}
          lang={lang}
          theme={theme}
        />
      );
    }

    switch (activeTab) {
      case 'quran':
        return <HomeScreen onSelectSurah={navigateToDetail} lang={lang} theme={theme} refreshTrigger={homeRefreshTrigger} />;
      case 'search':
        return <SearchScreen lang={lang} theme={theme} onSelectAyah={(num, name, ayah) => navigateToDetail(num, name, name, ayah)} />;
      case 'tasbih':
        return <TasbihScreen lang={lang} theme={theme} />;
      case 'adhkar':
        return <AdhkarScreen lang={lang} theme={theme} />;
      case 'khatma':
        return (
          <KhatmaScreen
            isStarted={isKhatmaStarted}
            currentKhatmaDay={currentKhatmaDay}
            totalKhatmaDays={totalKhatmaDays}
            onStartReading={handleStartKhatmaReading}
            onComplete={handleCompletePortion}
            history={khatmaHistory}
            lang={lang}
            theme={theme}
            onSetPlan={(days) => {
              if (days === 0) {
                setIsKhatmaStarted(false);
                setKhatmaHistory([]);
              }
              else {
                setTotalKhatmaDays(days);
                setIsKhatmaStarted(true);
                setCurrentKhatmaDay(1);
                setKhatmaHistory([]);
              }
            }}
          />
        );
      case 'prayer':
        return <PrayerScreen lang={lang} theme={theme} />;
      case 'saved':
        return <SavedScreen onSelectBookmark={(num, name, ayah) => navigateToDetail(num, name, name, ayah)} lang={lang} theme={theme} />;
      case 'settings':
        return <SettingsScreen lang={lang} theme={theme} onToggleLang={toggleLanguage} onToggleTheme={toggleTheme} />;
      case 'hadith':
        return <HadithScreen lang={lang} theme={theme} />;
      default:
        return <HomeScreen onSelectSurah={navigateToDetail} lang={lang} theme={theme} />;
    }
  };

  const activeColors = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: activeColors.background }}>
        <MoreMenuSheet
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          activeColors={activeColors}
        />

        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {renderContent()}
            </View>

            {currentScreen === 'list' && (
              <BottomTabNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                lang={lang}
                activeColors={activeColors}
                onMorePress={() => setIsMenuOpen(true)}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

// --- CONFIGURATION FOR TOP BAR POSITION ---
const TOP_SPACING = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10;

// --- CONFIGURATION FOR MENU ICON SPECIFICALLY ---
const MENU_ICON_Y = 20; // Change this to move the menu icon Up (-) or Down (+)
const MENU_ICON_X = 0; // Change this to move the menu icon Left (-) or Right (+)

const styles = StyleSheet.create({
  simpleHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.1)',
  },
  logoText: { color: Colors.secondary, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },

  tabBar: {
    height: 90,
    borderTopWidth: 1,
    paddingBottom: 30,
    paddingTop: 10
  },
  tabScroll: { alignItems: 'center', paddingHorizontal: 10 },
  tabItem: { paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' },
  tabText: { color: '#B7D1C4', fontSize: 12 },
  activeTabText: { color: '#D4AF37', fontWeight: 'bold' },
});
