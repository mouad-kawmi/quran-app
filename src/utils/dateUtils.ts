export const getHijriDate = (lang: string) => {
    try {
        const date = new Date();
        const locale = lang === 'ar' ? 'ar-SA' : 'en-US';

        const hijri = date.toLocaleDateString(locale + '-u-ca-islamic-uma-nu-latn', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // If it still returns Gregorian year (like 2026), use manual fallback
        if (hijri.includes('2026') || hijri.includes('2025')) {
            throw new Error('Intl Hijri not supported');
        }
        return hijri;
    } catch (e) {
        // Manual Hijri calculation (Kuwaiti algorithm)
        const date = new Date();
        let day = date.getDate();
        let month = date.getMonth();
        let year = date.getFullYear();

        let m = month + 1;
        let y = year;
        if (m < 3) {
            y -= 1;
            m += 12;
        }

        let a = Math.floor(y / 100);
        let b = 2 - a + Math.floor(a / 4);
        let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

        let z = jd + 1;
        let cyc = Math.floor((z - 1867216.25) / 36524.25);
        let jda = z + 1 + cyc - Math.floor(cyc / 4);
        let jb = jda + 1524;
        let jc = Math.floor((jb - 122.1) / 365.25);
        let jd_val = Math.floor(365.25 * jc);
        let je = Math.floor((jb - jd_val) / 30.6001);
        let day_val = jb - jd_val - Math.floor(30.6001 * je);
        let month_val = je < 14 ? je - 1 : je - 13;
        let year_val = month_val > 2 ? jc - 4716 : jc - 4715;

        let l = jd - 1948440 + 10632;
        let n = Math.floor((l - 1) / 10631);
        l = l - 10631 * n + 354;
        let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l + 2450) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l + 2423) / 15342));
        l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j + 1) / 50)) - (Math.floor(j / 16)) * (Math.floor((15342 * j + 2) / 43)) + 29;
        let m_h = Math.floor((24 * l) / 709);
        let d_h = l - Math.floor((709 * m_h) / 24);
        let y_h = 30 * n + j - 30;

        const monthsAr = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
        const monthsEn = ["Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani", "Jumada al-ula", "Jumada al-akhira", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"];

        if (lang === 'ar') {
            return `${d_h} ${monthsAr[m_h - 1]} ${y_h}`;
        }
        return `${monthsEn[m_h - 1]} ${d_h}, ${y_h}`;
    }
};

export const getFullGregorianDate = (lang: string) => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    if (lang === 'ar') {
        const daysAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

        const dayName = daysAr[date.getDay()];
        const day = date.getDate();
        const monthName = monthsAr[date.getMonth()];
        const year = date.getFullYear();

        return `${dayName} ${day} ${monthName} ${year}`;
    }

    return date.toLocaleDateString('en-US', options);
};
