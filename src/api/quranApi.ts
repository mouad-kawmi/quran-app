import axios from 'axios';
import { SURAH_LIST_DATA } from '../constants/SurahData';
import { Storage } from '../utils/storage';

const BASE_URL = 'https://api.alquran.cloud/v1';

export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export const fetchSurahs = async (): Promise<Surah[]> => {
    if (SURAH_LIST_DATA && SURAH_LIST_DATA.length > 0) {
        return SURAH_LIST_DATA;
    }
    // Deep fallback if import fails for any reason
    return [
        { "number": 1, "name": "سُورَةُ ٱلْفَاتِحَةِ", "englishName": "Al-Faatiha", "englishNameTranslation": "The Opening", "numberOfAyahs": 7, "revelationType": "Meccan" },
        { "number": 2, "name": "سُورَةُ البَقَرَةِ", "englishName": "Al-Baqara", "englishNameTranslation": "The Cow", "numberOfAyahs": 286, "revelationType": "Medinan" }
    ];
};

export const fetchSurahDetail = async (surahNumber: number) => {
    try {
        // Reduced editions to save space (Uthmani text + Muyassar tafsir + Pickthall translation)
        const response = await axios.get(`${BASE_URL}/surah/${surahNumber}/editions/quran-uthmani,ar.muyassar,en.pickthall`, { timeout: 10000 });
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching surah ${surahNumber}:`, error);
        throw error;
    }
};

export const searchQuranLocal = async (query: string): Promise<any[]> => {
    const results: any[] = [];
    const normalizedQuery = query.trim().replace(/[ًٌٍَُِّْٰ]/g, '');

    if (normalizedQuery.length < 3) return [];

    for (let i = 1; i <= 114; i++) {
        const cached = await Storage.getSurahCache(i);
        if (!cached || !Array.isArray(cached)) continue;

        // Find in Uthmani text (first edition usually)
        const uthmani = cached.find((e: any) => e.e.id.includes('uthmani') || e.e.id.includes('simple'));
        const surahInfo = SURAH_LIST_DATA.find(s => s.number === i);

        if (uthmani && surahInfo) {
            uthmani.a.forEach((ayah: any) => {
                const normalizedText = ayah.t.replace(/[ًٌٍَُِّْٰ]/g, '');
                if (normalizedText.includes(normalizedQuery)) {
                    results.push({
                        text: ayah.t,
                        numberInSurah: ayah.ns,
                        surah: {
                            number: i,
                            name: surahInfo.name,
                            englishName: surahInfo.englishName
                        }
                    });
                }
            });
        }
        if (results.length >= 50) break; // Limit results for performance
    }
    return results;
};

export const searchQuran = async (query: string): Promise<any[]> => {
    const cleanText = query.trim();
    if (!cleanText) return [];

    try {
        const encodedQuery = encodeURIComponent(cleanText);

        // Fetch Arabic and English results in parallel safely
        const [resEn, resAr] = await Promise.allSettled([
            axios.get(`${BASE_URL}/search/${encodedQuery}/all/en.pickthall`),
            axios.get(`${BASE_URL}/search/${encodedQuery}/all/quran-simple-clean`)
        ]);

        let resultsEn: any[] = [];
        let resultsAr: any[] = [];

        if (resEn.status === 'fulfilled' && resEn.value.data?.data?.matches) {
            resultsEn = resEn.value.data.data.matches;
        }

        if (resAr.status === 'fulfilled' && resAr.value.data?.data?.matches) {
            resultsAr = resAr.value.data.data.matches;
        }

        // Merge results
        const combined = [...resultsEn, ...resultsAr];

        // Use a Map to ensure unique results by Surah:Ayah key
        const uniqueMap = new Map();
        combined.forEach(item => {
            const key = `${item.surah.number}:${item.numberInSurah}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        });

        const list = Array.from(uniqueMap.values());
        if (list.length > 0) return list;

        // If API returns no results, try local search
        return await searchQuranLocal(cleanText);
    } catch (error) {
        console.log('Search API failed, falling back to local search...');
        return await searchQuranLocal(cleanText);
    }
};
const LOCAL_HADITHS = [
    // Faith
    { ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", en: "Actions are but by intentions.", category: 'faith' },
    { ar: "الإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً، فَأَفْضَلُهَا قَوْلُ لاَ إِلَهَ إِلاَّ اللَّهُ", en: "Faith has over seventy branches, the most excellent of which is the declaration that there is no god but Allah.", category: 'faith' },
    { ar: "من قال: رضيت بالله ربا، وبالإسلام دينا، وبمحمد صلى الله عليه وسلم رسولا؛ وجبت له الجنة", en: "Whoever says: I am pleased with Allah as my Lord, Islam as my religion, and Muhammad as my Messenger; Paradise is guaranteed for him.", category: 'faith' },
    { ar: "ذاق طعم الإيمان من رضي بالله رباً وبالإسلام ديناً وبمحمد رسولاً", en: "He has relished the flavor of faith who is pleased with Allah as his Lord, with Islam as his religion and with Muhammad as his Prophet.", category: 'faith' },

    // Prayer
    { ar: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ... وَإِقَامِ الصَّلاَةِ", en: "Islam is built on five pillars... and establishing prayer.", category: 'prayer' },
    { ar: "أقرب ما يكون العبد من ربه وهو ساجد، فأكثروا الدعاء", en: "The nearest a servant comes to his Lord is when he is prostrating, so increase your supplications.", category: 'prayer' },
    { ar: "رَأْسُ الأَمْرِ الإِسْلاَمُ وَعَمُودُهُ الصَّلاَةُ", en: "The head of the matter is Islam and its pillar is prayer.", category: 'prayer' },
    { ar: "وجعلت قرة عيني في الصلاة", en: "My primary source of joy has been placed in prayer.", category: 'prayer' },

    // Fasting
    { ar: "لِلصَّائِمِ فَرْحَتَانِ فَرْحَةٌ عِنْدَ فِطْرِهِ وَفَرْحَةٌ عِنْدَ لِقَاءِ رَبِّهِ", en: "The fasting person has two occasions of joy: one when he breaks his fast and one when he meets his Lord.", category: 'fasting' },
    { ar: "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ", en: "Whoever fasts Ramadan out of faith and seeking reward, his previous sins will be forgiven.", category: 'fasting' },
    { ar: "تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً", en: "Eat Suhoor, for indeed there is blessing in Suhoor.", category: 'fasting' },
    { ar: "من لم يدع قول الزور والعمل به، فليس لله حاجة في أن يدع طعامه وشرابه", en: "Whoever does not give up false speech and evil deeds, Allah is not in need of his leaving his food and drink.", category: 'fasting' },

    // Ethics
    { ar: "إِنَّمَا بُعِثْتُ لأُتَمِّمَ مَكَارِمَ الأَخْلاقِ", en: "I was sent only to perfect noble character.", category: 'ethics' },
    { ar: "الْبِرُّ حُسْنُ الْخُلُقِ", en: "Righteousness is good character.", category: 'ethics' },
    { ar: "خياركم أحسنكم أخلاقاً", en: "The best of you are those who have the best character.", category: 'ethics' },
    { ar: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه", en: "None of you truly believes until he loves for his brother what he loves for himself.", category: 'ethics' },
    { ar: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن", en: "Fear Allah wherever you are, follow up an evil deed with a good one and it will wipe it out, and behave well towards people.", category: 'ethics' },

    // Knowledge
    { ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ", en: "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.", category: 'knowledge' },
    { ar: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ", en: "Seeking knowledge is an obligation upon every Muslim.", category: 'knowledge' },
    { ar: "من يرد الله به خيراً يفقهه في الدين", en: "When Allah wishes good for anyone, He instructs him in religion.", category: 'knowledge' },
];

export const fetchHadiths = async () => {
    try {
        // Updated to use a more stable generic list or CDN if needed, but keeping fallback silent
        // Relying primarily on local high-quality selection for stability
        return LOCAL_HADITHS;
    } catch (error) {
        console.log('Using local hadith backup');
        return LOCAL_HADITHS;
    }
};
