import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Helper to check for app updates (OTA) and prompt the user.
 */
export const checkForUpdates = async (lang: string) => {
    try {
        if (__DEV__) return;

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
    } catch (e) {
        console.log('[UpdateManager] Error:', e);
    }
};
