import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Translations } from '../constants/Translations';
import { Storage } from './storage';

export const NotificationService = {
    // 1. Register for Remote Push Notifications
    async registerForPushNotificationsAsync() {
        let token;

        // Skip in Expo Go to avoid the "removed from Expo Go" error screen in SDK 53
        if (Constants.appOwnership === 'expo' || !Device.isDevice) {
            console.log('[Push Notification] Skipping remote registration in Expo Go/Emulator');
            return;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

        try {
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            })).data;
            await Storage.savePushToken(token);
        } catch (e: any) {
            // Silently log to avoid red screen in Expo Go
            console.log('[Push Notification] Remote Token Error (Expected in Expo Go):', e.message);
        }

        return token;
    },

    // 2. Schedule Local Alerts (Same as before)
    async registerForNotifications() {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus === 'granted' && Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('adhkar', {
                    name: 'Adhkar Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                });

                await Notifications.setNotificationChannelAsync('daily', {
                    name: 'Daily Quran',
                    importance: Notifications.AndroidImportance.DEFAULT,
                });

                await Notifications.setNotificationChannelAsync('prayer', {
                    name: 'Prayer Times',
                    importance: Notifications.AndroidImportance.MAX,
                    sound: 'default',
                });
            }
            return finalStatus === 'granted';
        } catch (e) {
            return false;
        }
    },

    async scheduleAll(lang: 'ar' | 'en', timings?: any) {
        try {
            const hasPermission = await this.registerForNotifications();
            if (!hasPermission) {
                console.log('[Notifications] No permissions to schedule.');
                return;
            }

            // Cancel previous schedules to avoid duplicates
            await Notifications.cancelAllScheduledNotificationsAsync();

            const isAr = lang === 'ar';

            // 1. Daily Morning Quran Reminder
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? "آية اليوم 📖" : "Ayah of the Day 📖",
                    body: isAr ? "نور يومك بقراءة الورد اليومي" : "Illuminate your day with Quran",
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    android: { channelId: 'daily' }
                } as any,
                trigger: {
                    hour: 9,
                    minute: 0,
                    repeats: true,
                } as Notifications.NotificationTriggerInput,
            });

            // 2. Schedule Prayers if we have timings (passed or from storage)
            let prayerTimings = timings;
            if (!prayerTimings) {
                const cached = await Storage.getPrayerTimes();
                if (cached && cached.times) {
                    prayerTimings = cached.times;
                }
            }

            if (prayerTimings) {
                await this.schedulePrayers(lang, prayerTimings);
            }

            console.log('[Notifications] Success: All notifications scheduled.');
        } catch (e) {
            console.log('[Notifications] Schedule Error:', e);
        }
    },

    async schedulePrayers(lang: 'ar' | 'en', timings: any) {
        const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const isAr = lang === 'ar';
        const t = Translations[lang];

        for (const prayer of prayerKeys) {
            let timeStr = timings[prayer];
            if (!timeStr) continue;

            // Clean time string (e.g., "05:12 (CET)" -> "05:12")
            timeStr = timeStr.replace(/[^\d:]/g, '');
            const [hours, minutes] = timeStr.split(':').map(Number);

            if (isNaN(hours) || isNaN(minutes)) continue;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: isAr ? `حان الآن موعد صلاة ${t[prayer]}` : `It is now time for ${t[prayer]} prayer`,
                    body: isAr ? `حي على الصلاة، حي على الفلاح` : `Come to prayer, come to success`,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    categoryIdentifier: 'prayer',
                    android: { channelId: 'prayer' }
                } as any,
                trigger: {
                    hour: hours,
                    minute: minutes,
                    repeats: true,
                } as Notifications.NotificationTriggerInput,
            });
            console.log(`[Notifications] Scheduled ${prayer} at ${hours}:${minutes}`);
        }
    }
};
