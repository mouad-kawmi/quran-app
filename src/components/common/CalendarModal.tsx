import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { X, Calendar as CalendarIcon, Moon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { getHijriDate, getFullGregorianDate } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
    lang: 'en' | 'ar';
    activeColors: any;
}

const CalendarModal = ({ visible, onClose, lang, activeColors }: Props) => {
    const isAr = lang === 'ar';
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (visible) {
            setViewDate(new Date());
        }
    }, [visible]);

    const toWesternNumerals = (str: string) => {
        return str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    // Generate month grid for the currently viewed month
    const getMonthDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDaysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const weekDays = isAr ? weekDaysAr : weekDaysEn;
    const days = getMonthDays();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
                    {/* Header Gradient */}
                    <LinearGradient
                        colors={['#1B4332', '#081C15']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={20} color={Colors.white} />
                        </TouchableOpacity>

                        <View style={styles.monthNavRow}>
                            <TouchableOpacity onPress={() => changeMonth(isAr ? 1 : -1)} style={styles.navButton}>
                                <ChevronLeft size={24} color={Colors.white} />
                            </TouchableOpacity>

                            <View style={styles.dateTextCol}>
                                <Text style={styles.monthYearText}>
                                    {toWesternNumerals(viewDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' }))}
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => changeMonth(isAr ? -1 : 1)} style={styles.navButton}>
                                <ChevronRight size={24} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Hijri Date Box */}
                    <View style={styles.hijriContainer}>
                        <View style={styles.hijriContent}>
                            <Moon size={24} color={Colors.secondary} />
                            <View style={{ marginLeft: 15 }}>
                                <Text style={[styles.hijriLabel, { color: activeColors.textMuted }]}>
                                    {isAr ? 'التاريخ الهجري' : 'Hijri Date'}
                                </Text>
                                <Text style={[styles.hijriDateText, { color: activeColors.text }]}>
                                    {getHijriDate(lang)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarContainer}>
                        <View style={[styles.weekDaysRow, { direction: isAr ? 'rtl' : 'ltr' }]}>
                            {weekDays.map((day, idx) => (
                                <Text key={idx} style={[styles.weekDayText, { color: activeColors.textMuted }]}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        <View style={[styles.daysGrid, { direction: isAr ? 'rtl' : 'ltr' }]}>
                            {days.map((day, idx) => {
                                const isToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
                                return (
                                    <View key={idx} style={styles.dayCell}>
                                        {day && (
                                            <View style={[
                                                styles.dayCircle,
                                                isToday && { backgroundColor: Colors.secondary }
                                            ]}>
                                                <Text style={[
                                                    styles.dayText,
                                                    { color: isToday ? Colors.white : activeColors.text }
                                                ]}>
                                                    {day}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: width * 0.9,
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    headerGradient: {
        padding: 30,
        paddingTop: 40,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 10,
    },
    navButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    dateTextCol: {
        flex: 1,
        alignItems: 'center',
    },
    monthYearText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.white,
    },
    hijriContainer: {
        paddingHorizontal: 20,
        marginTop: -25,
    },
    hijriContent: {
        backgroundColor: Colors.dark.surfaceLight,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    hijriLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        fontWeight: '600',
    },
    hijriDateText: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
    },
    calendarContainer: {
        padding: 25,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100 / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '500',
    }
});

export default CalendarModal;
