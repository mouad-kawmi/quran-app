import React from 'react';
import HomeScreen from '../screens/HomeScreen';
import SurahDetailScreen from '../screens/SurahDetailScreen';
import TasbihScreen from '../screens/TasbihScreen';
import AdhkarScreen from '../screens/AdhkarScreen';
import KhatmaScreen from '../screens/KhatmaScreen';
import PortionReaderScreen from '../screens/PortionReaderScreen';
import PrayerScreen from '../screens/PrayerScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SearchScreen from '../screens/SearchScreen';
import HadithScreen from '../screens/HadithScreen';
import QiblaScreen from '../screens/QiblaScreen';

interface Props {
    activeTab: string;
    currentScreen: string;
    selectedSurah: any;
    lang: 'en' | 'ar';
    theme: 'dark' | 'light';
    reciter: string;
    setReciter: (r: string) => void;
    onBack: () => void;
    onSelectSurah: (num: number, name: string, arName: string, start?: number) => void;
    homeRefreshTrigger: number;
    // Khatma props
    khatmaState: any;
    onStartKhatmaReading: (juzs: number[]) => void;
    onCompletePortion: () => void;
    onSetKhatmaPlan: (days: number) => void;
    toggleLanguage: () => void;
    toggleTheme: () => void;
}

const Navigator = (props: Props) => {
    const {
        activeTab, currentScreen, selectedSurah, lang, theme, reciter, setReciter,
        onBack, onSelectSurah, homeRefreshTrigger, khatmaState,
        onStartKhatmaReading, onCompletePortion, onSetKhatmaPlan,
        toggleLanguage, toggleTheme
    } = props;

    if (currentScreen === 'detail' && selectedSurah) {
        return <SurahDetailScreen route={{ params: selectedSurah }} onBack={onBack} lang={lang} theme={theme} reciter={reciter} />;
    }

    if (currentScreen === 'khatma_reader') {
        return <PortionReaderScreen juzList={khatmaState.currentJuzSelection} onComplete={onCompletePortion} onBack={onBack} lang={lang} theme={theme} reciter={reciter} />;
    }

    switch (activeTab) {
        case 'quran': return <HomeScreen onSelectSurah={onSelectSurah} lang={lang} theme={theme} refreshTrigger={homeRefreshTrigger} />;
        case 'search': return <SearchScreen lang={lang} theme={theme} onSelectAyah={(num, name, ayah) => onSelectSurah(num, name, name, ayah)} />;
        case 'tasbih': return <TasbihScreen lang={lang} theme={theme} />;
        case 'adhkar': return <AdhkarScreen lang={lang} theme={theme} />;
        case 'khatma': return (
            <KhatmaScreen isStarted={khatmaState.isStarted} currentKhatmaDay={khatmaState.currentDay} totalKhatmaDays={khatmaState.totalDays}
                onStartReading={onStartKhatmaReading} onComplete={onCompletePortion} history={khatmaState.history} lang={lang} theme={theme} onSetPlan={onSetKhatmaPlan} />
        );
        case 'prayer': return <PrayerScreen lang={lang} theme={theme} />;
        case 'saved': return <SavedScreen onSelectBookmark={(num, name, ayah) => onSelectSurah(num, name, name, ayah)} lang={lang} theme={theme} />;
        case 'settings': return <SettingsScreen lang={lang} theme={theme} onToggleLang={toggleLanguage} onToggleTheme={toggleTheme} reciter={reciter} setReciter={setReciter} />;
        case 'hadith': return <HadithScreen lang={lang} theme={theme} />;
        case 'qibla': return <QiblaScreen lang={lang} theme={theme} />;
        default: return <HomeScreen onSelectSurah={onSelectSurah} lang={lang} theme={theme} />;
    }
};

export default Navigator;
