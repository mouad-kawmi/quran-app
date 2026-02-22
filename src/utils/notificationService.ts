import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Translations } from '../constants/Translations';
import { Storage } from './storage';

export const NotificationService = {
    async registerForNotifications() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus === 'granted' && Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('adhkar', {
                name: 'Adhkar Reminders',
                importance: Notifications.AndroidImportance.MAX,
                lightColor: '#74C69D',
            });

            await Notifications.setNotificationChannelAsync('daily', {
                name: 'Daily Quran',
                importance: Notifications.AndroidImportance.DEFAULT,
                lightColor: '#D4AF37',
            });

            await Notifications.setNotificationChannelAsync('prayer', {
                name: 'Prayer Times',
                importance: Notifications.AndroidImportance.MAX,
                sound: 'default',
            });
        }
        return finalStatus === 'granted';
    },

    async scheduleAll(lang: 'ar' | 'en', timings?: any) {
        try {
            const hasPermission = await this.registerForNotifications();
            if (!hasPermission) return;

            // Cancel all to avoid duplicates
            await Notifications.cancelAllScheduledNotificationsAsync();

            const isAr = lang === 'ar';

            // 1. General reminder (9 AM)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? "آية اليوم 📖" : "Ayah of the Day 📖",
                    body: isAr ? "نور يومك بقراءة الورد اليومي" : "Illuminate your day with Quran",
                    color: '#D4AF37',
                    categoryIdentifier: 'daily',
                },
                trigger: { hour: 9, minute: 0, repeats: true } as Notifications.NotificationTriggerInput,
            });

            // 2. Morning Adhkar (7 AM)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? "أذكار الصباح ☀️" : "Morning Adhkar ☀️",
                    body: isAr ? "ابدأ يومك بذكر الله وطمأنينة القلب" : "Start your day with remembrance and peace",
                    color: '#FFD700',
                    categoryIdentifier: 'adhkar',
                },
                trigger: { hour: 7, minute: 0, repeats: true } as Notifications.NotificationTriggerInput,
            });

            // 3. Evening Adhkar (5 PM)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? "أذكار المساء 🌙" : "Evening Adhkar 🌙",
                    body: isAr ? "حصن نفسك بذكر الله في مساءك" : "Protect yourself with evening Adhkar",
                    color: '#1B4332',
                    categoryIdentifier: 'adhkar',
                },
                trigger: { hour: 17, minute: 0, repeats: true } as Notifications.NotificationTriggerInput,
            });

            // 4. Friday Surah Al-Kahf (Friday 10 AM)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? "نور ما بين الجمعتين 🕯️" : "Friday Light 🕯️",
                    body: isAr ? "لا تنسَ قراءة سورة الكهف في هذا اليوم المبارك" : "Don't forget to read Surah Al-Kahf today",
                    color: '#D4AF37',
                    categoryIdentifier: 'daily',
                },
                trigger: { weekday: 6, hour: 10, minute: 0, repeats: true } as Notifications.NotificationTriggerInput,
            });

            // 5. Prayer Notifications
            if (timings) {
                await this.schedulePrayers(lang, timings);
            } else {
                // Try to load from storage if not provided
                const cached = await Storage.getPrayerTimes();
                if (cached && cached.times) {
                    await this.schedulePrayers(lang, cached.times);
                }
            }
        } catch (e) {
            console.log('Error scheduling notifications:', e);
        }
    },

    async schedulePrayers(lang: 'ar' | 'en', timings: any) {
        const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const isAr = lang === 'ar';
        const t = Translations[lang];

        for (const prayer of prayerKeys) {
            const timeStr = timings[prayer]; // Expected format "HH:mm"
            if (!timeStr) continue;

            const [hours, minutes] = timeStr.split(':').map(Number);

            // 1. Notification at exact time (Repeating daily)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? `حان الآن موعد صلاة ${t[prayer]}` : `It is now time for ${t[prayer]} prayer`,
                    body: isAr ? `حي على الصلاة، حي على الفلاح` : `Come to prayer, come to success`,
                    sound: true,
                },
                trigger: {
                    hour: hours,
                    minute: minutes,
                    repeats: true
                } as Notifications.NotificationTriggerInput,
            });

            // 2. Notification 5 minutes before (Repeating daily)
            // Handle edge case where minutes < 5
            let warnHours = hours;
            let warnMinutes = minutes - 5;
            if (warnMinutes < 0) {
                warnMinutes += 60;
                warnHours = (warnHours - 1 + 24) % 24;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? `اقترب موعد صلاة ${t[prayer]}` : `${t[prayer]} prayer is approaching`,
                    body: isAr ? `بقي 5 دقائق على الأذان. استعد للصلاة.` : `5 minutes left until Adhan. Get ready for prayer.`,
                },
                trigger: {
                    hour: warnHours,
                    minute: warnMinutes,
                    repeats: true
                } as Notifications.NotificationTriggerInput,
            });
        }
    }
};
