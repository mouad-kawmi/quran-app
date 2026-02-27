import { useState } from 'react';
import { fetchSurahDetail, Surah } from '../api/quranApi';
import { Storage } from '../utils/storage';

/**
 * Hook to handle downloading Quran data for offline use.
 */
export const useQuranSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);

    const checkAndSyncQuran = async (surahList: Surah[]) => {
        const isSynced = await Storage.isFullSynced();
        if (isSynced) return;

        setIsSyncing(true);
        let count = 0;
        const totalItems = surahList.length + 30; // 114 Surahs + 30 Juzs

        // 1. Sync Surahs
        for (const surah of surahList) {
            try {
                const cached = await Storage.getSurahCache(surah.number);
                if (!cached) {
                    const fullDetails = await fetchSurahDetail(surah.number);
                    const minimized = fullDetails.map((edition: any) => ({
                        e: { id: edition.edition.identifier },
                        a: edition.ayahs.map((a: any) => ({
                            n: a.number,
                            ns: a.numberInSurah,
                            t: a.text,
                            p: a.page,
                            j: a.juz
                        }))
                    }));
                    await Storage.saveSurahCache(surah.number, minimized);
                    await new Promise(res => setTimeout(res, 100));
                }
                count++;
                setSyncProgress(Math.floor((count / totalItems) * 100));
            } catch (e) {
                count++;
            }
        }

        // 2. Sync Juzs
        for (let j = 1; j <= 30; j++) {
            try {
                const cachedJuz = await Storage.getJuzCache(j);
                if (!cachedJuz) {
                    const response = await fetch(`https://api.alquran.cloud/v1/juz/${j}/quran-uthmani`);
                    const json = await response.json();
                    if (json.data?.ayahs) {
                        await Storage.saveJuzCache(j, json.data.ayahs);
                        await new Promise(res => setTimeout(res, 100));
                    }
                }
                count++;
                setSyncProgress(Math.floor((count / totalItems) * 100));
            } catch (e) {
                count++;
            }
        }

        if (count >= totalItems) {
            await Storage.setFullSync(true);
        }
        setIsSyncing(false);
    };

    return { isSyncing, syncProgress, checkAndSyncQuran };
};
