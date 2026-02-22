import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { Translations } from '../constants/Translations';
import { Colors } from '../constants/Colors';
import { Storage } from '../utils/storage';
import { Trash2, X, Bell, ShieldCheck, Clock, Sun, BookOpen } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../utils/notificationService';
import { Download, CheckCircle, Loader2 } from 'lucide-react-native';
import axios from 'axios';

interface Props {
    lang: string;
    theme: 'dark' | 'light';
    onToggleLang: () => void;
    onToggleTheme: () => void;
}

const SettingsScreen = ({ lang, theme, onToggleLang, onToggleTheme }: Props) => {
    const t = Translations[lang];
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloaded, setIsDownloaded] = useState(false);

    useEffect(() => {
        checkDownloadStatus();
    }, []);

    const checkDownloadStatus = async () => {
        const fullSync = await Storage.isFullSynced();
        setIsDownloaded(fullSync);
    };

    const handleDownloadAll = async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            for (let i = 1; i <= 30; i++) {
                // Fetch Juz
                const response = await axios.get(`https://api.alquran.cloud/v1/juz/${i}/quran-uthmani`, { timeout: 15000 });
                if (response.data && response.data.data) {
                    await Storage.saveJuzCache(i, response.data.data.ayahs);
                }
                setDownloadProgress(Math.round((i / 30) * 100));
            }
            await Storage.setFullSync(true);
            setIsDownloaded(true);
            Alert.alert(lang === 'ar' ? "تم التحميل" : "Download Complete", lang === 'ar' ? "تم تحميل المصحف كاملاً بنجاح." : "Full Quran downloaded successfully.");
        } catch (error) {
            console.error("Download failed:", error);
            Alert.alert(lang === 'ar' ? "خطأ" : "Error", lang === 'ar' ? "فشل التحميل. يرجى التأكد من الإنترنت والمساحة." : "Download failed. Please check internet and storage.");
        } finally {
            setIsDownloading(false);
        }
    };

    const isDark = theme === 'dark';
    const handleResetApp = () => {
        Alert.alert(
            lang === 'ar' ? "إعادة ضبط التطبيق" : "Reset App",
            lang === 'ar'
                ? "سيتم مسح كل شيء (المحفوظات، الأذكار، القرآن). سيحل هذا غلباً مشكلة الذاكرة ممتلئة. هل أنت متأكد؟"
                : "This will clear everything (Bookmarks, Tasbih, Quran). This usually fixes 'Disk Full' errors. Are you sure?",
            [
                { text: lang === 'ar' ? "إلغاء" : "Cancel", style: "cancel" },
                {
                    text: lang === 'ar' ? "إعادة ضبط" : "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await Storage.resetEverything();
                        Alert.alert(
                            lang === 'ar' ? "تم" : "Done",
                            lang === 'ar' ? "تمت إعادة الضبط. يرجى إغلاق التطبيق وفتحه من جديد." : "App reset. Please close and restart the app.",
                            [{ text: "OK" }]
                        );
                    }
                }
            ]
        );
    };
    const activeColors = isDark ? Colors.dark : Colors.light;

    const handleClearCache = () => {
        Alert.alert(
            lang === 'ar' ? "مسح الذاكرة" : "Clear Cache",
            lang === 'ar' ? "سيتم مسح القرآن المحمل للأوفلاين. هل أنت متأكد؟" : "Offline Quran data will be cleared. Are you sure?",
            [
                { text: lang === 'ar' ? "إلغاء" : "Cancel", style: "cancel" },
                {
                    text: lang === 'ar' ? "مسح" : "Clear",
                    style: "destructive",
                    onPress: async () => {
                        await Storage.clearAllCache();
                        Alert.alert(lang === 'ar' ? "تم" : "Done", lang === 'ar' ? "تم مسح البيانات بنجاح." : "Cache cleared successfully.");
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.header, { backgroundColor: activeColors.surface }]}>
                <Text style={[styles.title, { color: Colors.secondary }]}>{t.settings}</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.settingItem, { backgroundColor: activeColors.surface }]}>
                    <View>
                        <Text style={[styles.settingLabel, { color: activeColors.text }]}>{t.language}</Text>
                        <Text style={[styles.settingValue, { color: activeColors.textMuted }]}>
                            {lang === 'en' ? 'English' : 'العربية'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.toggleBtn} onPress={onToggleLang}>
                        <Text style={styles.toggleBtnText}>{lang === 'en' ? 'AR' : 'EN'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.settingItem, { backgroundColor: activeColors.surface }]}>
                    <View>
                        <Text style={[styles.settingLabel, { color: activeColors.text }]}>
                            {lang === 'ar' ? 'المظهر الليلي' : 'Dark Mode'}
                        </Text>
                        <Text style={[styles.settingValue, { color: activeColors.textMuted }]}>
                            {isDark ? (lang === 'ar' ? 'مفعل' : 'On') : (lang === 'ar' ? 'معطل' : 'Off')}
                        </Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={onToggleTheme}
                        trackColor={{ false: '#767577', true: Colors.secondary }}
                        thumbColor={isDark ? Colors.white : '#f4f3f4'}
                    />
                </View>

                <View style={[styles.settingItem, { backgroundColor: activeColors.surface }]}>
                    <View>
                        <Text style={[styles.settingLabel, { color: activeColors.text }]}>
                            {lang === 'ar' ? 'مسح الذاكرة المؤقتة' : 'Clear Cache'}
                        </Text>
                        <Text style={[styles.settingValue, { color: activeColors.textMuted }]}>
                            {lang === 'ar' ? 'إزالة السور المحملة' : 'Remove downloaded Surahs'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: '#ff4444' }]} onPress={handleClearCache}>
                        <Trash2 size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Full Offline Download */}
                <View style={[styles.downloadCard, { backgroundColor: isDownloaded ? 'rgba(76, 175, 80, 0.1)' : activeColors.surface, borderColor: isDownloaded ? '#4CAF50' : activeColors.surfaceLight }]}>
                    <View style={styles.downloadHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.downloadTitle, { color: activeColors.text }]}>
                                {lang === 'ar' ? 'تحميل المصحف كاملاً' : 'Full Quran Download'}
                            </Text>
                            <Text style={[styles.downloadSub, { color: activeColors.textMuted }]}>
                                {isDownloaded
                                    ? (lang === 'ar' ? 'التطبيق جاهز للعمل بدون إنترنت' : 'App is ready for offline use')
                                    : (lang === 'ar' ? 'حمل المصحف للاستمرار بدون إنترنت' : 'Download for offline use')}
                            </Text>
                        </View>
                        {isDownloaded ? (
                            <CheckCircle size={24} color="#4CAF50" />
                        ) : isDownloading ? (
                            <View style={styles.loaderBox}>
                                <Text style={[styles.progressText, { color: Colors.secondary }]}>{downloadProgress}%</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: Colors.secondary }]} onPress={handleDownloadAll}>
                                <Download size={20} color={Colors.dark.background} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {isDownloading && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBarBg, { backgroundColor: activeColors.surfaceLight }]}>
                                <View style={[styles.progressBarFill, { width: `${downloadProgress}%`, backgroundColor: Colors.secondary }]} />
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.sectionTitleBox}>
                    <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
                        {lang === 'ar' ? 'تخصيص التنبيهات' : 'Notifications Preview'}
                    </Text>
                </View>

                <View style={[styles.previewSection, { backgroundColor: activeColors.surface }]}>
                    <Text style={[styles.previewDesc, { color: activeColors.textMuted }]}>
                        {lang === 'ar' ? 'جرب كيف تظهر التنبيهات على هاتفك:' : 'Experience how notifications look on your device:'}
                    </Text>

                    <View style={styles.testButtonsRow}>
                        <TouchableOpacity
                            style={[styles.testIconBtn, { backgroundColor: 'rgba(116, 198, 157, 0.1)' }]}
                            onPress={async () => {
                                await Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: lang === 'ar' ? 'أذكار الصباح ☀️' : 'Morning Adhkar ☀️',
                                        body: lang === 'ar' ? 'ابدأ يومك ببركة الأذكار وطمأنينة القلب' : 'Start your day with blessings and peace',
                                        color: '#74C69D',
                                        categoryIdentifier: 'adhkar',
                                    },
                                    trigger: null,
                                });
                            }}
                        >
                            <Sun size={20} color="#74C69D" />
                            <Text style={[styles.testBtnLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'أذكار' : 'Adhkar'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.testIconBtn, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}
                            onPress={async () => {
                                await Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: lang === 'ar' ? 'آية اليوم 📖' : 'Ayah of the Day 📖',
                                        body: lang === 'ar' ? 'نور يومك بقراءة الورد اليومي من القرآن' : 'Illuminate your day with Quran',
                                        color: '#D4AF37',
                                        categoryIdentifier: 'daily',
                                    },
                                    trigger: null,
                                });
                            }}
                        >
                            <BookOpen size={20} color="#D4AF37" />
                            <Text style={[styles.testBtnLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'آية' : 'Ayah'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.testIconBtn, { backgroundColor: 'rgba(8, 28, 21, 0.1)' }]}
                            onPress={async () => {
                                await Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: lang === 'ar' ? 'موعد الصلاة 🕌' : 'Prayer Time 🕌',
                                        body: lang === 'ar' ? 'حان الآن موعد صلاة الظهر. حي على الصلاة.' : 'It is now time for Dhuhr prayer.',
                                        color: '#081C15',
                                        categoryIdentifier: 'prayer',
                                    },
                                    trigger: null,
                                });
                            }}
                        >
                            <Clock size={20} color={activeColors.text} />
                            <Text style={[styles.testBtnLabel, { color: activeColors.text }]}>{lang === 'ar' ? 'صلاة' : 'Prayer'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.settingItem, { backgroundColor: activeColors.surface }]}>
                    <View>
                        <Text style={[styles.settingLabel, { color: '#ff4444' }]}>
                            {lang === 'ar' ? 'إعادة ضبط التطبيق' : 'Full Reset'}
                        </Text>
                        <Text style={[styles.settingValue, { color: activeColors.textMuted }]}>
                            {lang === 'ar' ? 'مسح شامل (لحل مشكلة الذاكرة)' : 'Fix Disk Full Errors'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: '#ff4444' }]} onPress={handleResetApp}>
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Text style={[styles.versionText, { color: activeColors.textMuted }]}>Quran Premium v1.1.2</Text>
                    <Text style={[styles.creditsText, { color: Colors.secondary }]}>Developed with ❤️ for the Ummah</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    settingLabel: { fontSize: 16, fontWeight: '600' },
    settingValue: { fontSize: 12, marginTop: 4 },
    toggleBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    toggleBtnText: { color: '#081C15', fontWeight: 'bold' },
    infoBox: { marginTop: 30, alignItems: 'center' },
    versionText: { fontSize: 12 },
    creditsText: { fontSize: 14, fontWeight: 'bold', marginTop: 10 },
    sectionTitleBox: { paddingHorizontal: 5, marginBottom: 15, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    previewSection: { padding: 20, borderRadius: 20, marginBottom: 20 },
    previewDesc: { fontSize: 13, marginBottom: 15, lineHeight: 18 },
    testButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    testIconBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    testBtnLabel: { fontSize: 11, fontWeight: 'bold', marginTop: 8 },
    downloadCard: { padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1 },
    downloadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    downloadTitle: { fontSize: 16, fontWeight: 'bold' },
    downloadSub: { fontSize: 12, marginTop: 4 },
    downloadBtn: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    progressContainer: { marginTop: 15 },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    loaderBox: { alignItems: 'center', justifyContent: 'center' },
    progressText: { fontSize: 14, fontWeight: 'bold' }
});

export default SettingsScreen;
