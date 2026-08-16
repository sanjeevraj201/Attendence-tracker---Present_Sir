import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  PanResponder, Animated, Alert, ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Subject } from '../../types/attendance.types';
import { ODMLRequest, AttendanceCorrectionRequest } from '../../types/session.types';
import { BookOpen, Lock, RotateCcw } from 'lucide-react-native';
import { getPendingODMLForStudent, withdrawODMLRequest, createCorrectionRequest } from '../../services/firestore.service';
import { useAuthStore } from '../../stores/auth.store';
import { useColorScheme } from 'nativewind';

interface CalendarActionModalProps {
  visible: boolean;
  subject: Subject | null;
  type: 'OD' | 'ML';
  onClose: () => void;
  onSubmit: (dates: string[], reason: string) => Promise<void>;
}

// Mark Sundays and public holidays
const PUBLIC_HOLIDAYS: string[] = [
  '2026-01-01', '2026-01-26', '2026-03-29', '2026-04-14',
  '2026-04-18', '2026-08-15', '2026-10-02', '2026-10-20',
  '2026-10-24', '2026-11-04', '2026-11-14', '2026-12-25',
];

const isSunday = (dateStr: string) => new Date(dateStr).getDay() === 0;

const getMonthYear = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

/** Returns midnight at end-of-day for a date string YYYY-MM-DD */
const getMidnightCutoff = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number);
  // End of that calendar day = next day at 00:00:00.000
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0).getTime();
};

export const CalendarActionModal = ({
  visible, subject, type, onClose, onSubmit,
}: CalendarActionModalProps) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pendingRequests, setPendingRequests] = useState<ODMLRequest[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [undoingDates, setUndoingDates] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  // Correction request sheet state
  const [correctionVisible, setCorrectionVisible] = useState(false);
  const [correctionDate, setCorrectionDate] = useState('');
  const [correctionType, setCorrectionType] = useState<'OD' | 'ML'>('OD');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const user = useAuthStore(state => state.user);
  const uid = user?.uid;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  // Swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && subject && uid) {
      setSelectedDates([]);
      setReason('');
      setCurrentMonth(new Date());
      translateY.setValue(0);
      // Fetch pending requests for this subject + type
      setIsFetching(true);
      getPendingODMLForStudent(uid, subject.code)
        .then(setPendingRequests)
        .catch(() => setPendingRequests([]))
        .finally(() => setIsFetching(false));
    }
  }, [visible, subject?.code, uid]);

  if (!subject) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOD = type === 'OD';
  const accentColor = isOD ? '#3B82F6' : '#A855F7';
  const accentBg = isOD ? '#EFF6FF' : '#F5F3FF';
  const accentLight = isOD ? '#BFDBFE' : '#DDD6FE';
  const now = Date.now();

  // Build a map: date → pending request info (for undo logic)
  // Key = date string, value = { requestId, submittedAt, canUndo }
  const pendingDateMap: Record<string, { requestId: string; canUndo: boolean; reqType?: 'OD' | 'ML' }> = {};
  pendingRequests.forEach(req => {
    req.dates.forEach(date => {
      const cutoff = getMidnightCutoff(date);
      pendingDateMap[date] = {
        requestId: req.requestId, reqType: req.type,
        canUndo: now < cutoff,
      };
    });
  });

  // --- Build marked dates for the calendar ---
  const markedDates: any = {};

  // APPROVED entries (from local history) → filled circles
  const approvedDates = new Set<string>(); // fast lookup for onDayPress guard
  subject.history.forEach(record => {
    markedDates[record.date] = {
      ...(markedDates[record.date] || {}),
      approvedType: record.type,
      disableTouchEvent: record.type === 'PRESENT', // Cannot request on present days
    };
    if (record.type === 'OD' || record.type === 'ML') {
      approvedDates.add(record.date);
    }
  });

  // PENDING entries (from Firestore) → colored dot below date
  Object.entries(pendingDateMap).forEach(([date, info]) => {
    if (!markedDates[date]?.approvedType) {
      markedDates[date] = {
        ...(markedDates[date] || {}),
        pendingType: info.reqType,
        canUndo: info.canUndo,
        requestId: info.requestId,
        marked: true,
        dotColor: info.reqType === 'OD' ? '#3B82F6' : '#A855F7',
        disableTouchEvent: !info.canUndo,
      };
    }
  });

  // Mark Sundays
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (isSunday(dateStr)) {
      markedDates[dateStr] = {
        ...(markedDates[dateStr] || {}),
        disabled: true,
        customStyles: { text: { color: '#EF4444', fontWeight: '600' } },
        disableTouchEvent: true,
      };
    }
  }

  // Public holidays
  PUBLIC_HOLIDAYS.forEach(date => {
    markedDates[date] = {
      ...(markedDates[date] || {}),
      disabled: true,
      marked: true,
      dotColor: '#F59E0B',
      disableTouchEvent: true,
    };
  });

  // User's current in-session selections
  selectedDates.forEach(date => {
    markedDates[date] = {
      ...(markedDates[date] || {}),
      selectedForRequest: true, // Custom flag to avoid conflicts
      disableTouchEvent: false,
    };
  });

  const onDayPress = async (day: any) => {
    const dateStr: string = day.dateString;
    if (dateStr > todayStr) return;
    if (isSunday(dateStr)) return;
    if (PUBLIC_HOLIDAYS.includes(dateStr)) return;

    // ─── APPROVED DATE: already has OD or ML in history ───
    if (approvedDates.has(dateStr)) {
      const existingType: 'OD' | 'ML' = markedDates[dateStr]?.approvedType ?? 'OD';
      // Show options: info toast + offer to file correction
      Alert.alert(
        `${existingType === 'OD' ? 'OD' : 'Medical Leave'} Already Marked`,
        `This date (${dateStr}) already has a ${existingType} entry.\n\nIf this was a mistake, you can request a correction from your faculty or admin.`,
        [
          { text: 'Dismiss', style: 'cancel' },
          {
            text: 'Request Correction',
            onPress: () => {
              setCorrectionDate(dateStr);
              setCorrectionType(existingType);
              setCorrectionReason('');
              setCorrectionVisible(true);
            },
          },
        ]
      );
      return;
    }

    // ─── PENDING DATE: submitted but not yet approved ───
    const pendingInfo = pendingDateMap[dateStr];
    if (pendingInfo) {
      if (!pendingInfo.canUndo) {
        showToast('🔒 Midnight cutoff passed — this request can no longer be withdrawn');
        return;
      }
      Alert.alert(
        'Withdraw Request?',
        `This will cancel your ${type} request for ${dateStr} and remove it from the faculty's inbox.`,
        [
          { text: 'Keep', style: 'cancel' },
          {
            text: 'Withdraw', style: 'destructive',
            onPress: async () => {
              if (!subject || !uid) return;
              try {
                setUndoingDates(prev => [...prev, dateStr]);
                await withdrawODMLRequest(pendingInfo.requestId, dateStr);
                const updated = await getPendingODMLForStudent(uid, subject.code);
                setPendingRequests(updated);
              } catch (e) {
                Alert.alert('Error', 'Failed to withdraw request. Please try again.');
              } finally {
                setUndoingDates(prev => prev.filter(d => d !== dateStr));
              }
            },
          },
        ]
      );
      return;
    }

    // ─── Normal select / deselect for new dates ───
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedDates, reason);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to submit the request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!subject || !uid || !correctionReason.trim()) return;
    setCorrectionSubmitting(true);
    try {
      const req: AttendanceCorrectionRequest = {
        requestId: `corr_${uid}_${correctionDate}_${Date.now()}`,
        studentId: uid,
        studentName: user?.displayName || 'Student',
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        date: correctionDate,
        currentType: correctionType,
        reason: correctionReason.trim(),
        status: 'PENDING',
        createdAt: Date.now(),
      };
      await createCorrectionRequest(req);
      setCorrectionVisible(false);
      showToast('✅ Correction request sent to faculty/admin');
    } catch {
      Alert.alert('Error', 'Failed to submit correction request. Please try again.');
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date()) setCurrentMonth(next);
  };

  const today = new Date();
  const isNextDisabled =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth();

  const calendarKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Draggable handle bar */}
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header row: title + date badge */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Select Dates</Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeMonth}>
                {today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </Text>
              <Text style={styles.dateBadgeDay}>{today.getDate()}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Custom month nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                <Text style={styles.navArrow}>{'‹'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{getMonthYear(currentMonth)}</Text>
              <TouchableOpacity
                onPress={goToNextMonth}
                style={[styles.navBtn, isNextDisabled && styles.navBtnDisabled]}
                disabled={isNextDisabled}
              >
                <Text style={[styles.navArrow, isNextDisabled && styles.navArrowDisabled]}>{'›'}</Text>
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <Calendar
              key={calendarKey}
              current={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`}
              maxDate={todayStr}
              onDayPress={onDayPress}
              markedDates={markedDates}
              hideArrows={true}
              renderHeader={() => null}
              style={styles.calendar}
              markingType="custom"
              theme={{
                calendarBackground: isDark ? '#1F2937' : '#FFFFFF',
                // Sunday column header: we handle colour via custom day rendering
                textSectionTitleColor: '#6B7280',
                selectedDayBackgroundColor: accentColor,
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#F59E0B',
                todayBackgroundColor: '#FEF9C3',
                dayTextColor: isDark ? '#FFFFFF' : '#111827',
                // Do NOT set textDisabledColor globally — only Sundays should be red
                textDisabledColor: '#D1D5DB',
                arrowColor: accentColor,
                monthTextColor: isDark ? '#FFFFFF' : '#111827',
                textDayFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textMonthFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayHeaderFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textMonthFontWeight: '700',
                textDayFontWeight: '600',
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
              }}
              dayComponent={({ date, state, marking, onPress }: any) => {
                if (!date) return <View style={dayStyles.outer} />;

                const isSun = new Date(date.dateString).getDay() === 0;
                const isDisabled = state === 'disabled' || marking?.disableTouchEvent;
                const isSelected = marking?.selectedForRequest;
                const isToday = state === 'today';
                const approvedType: 'OD' | 'ML' | 'PRESENT' | 'ABSENT' | undefined = marking?.approvedType;
                const isPending = !!marking?.pendingType;
                const canUndo: boolean = marking?.canUndo === true;
                const isUndoing = undoingDates.includes(date.dateString);
                const hasDot = marking?.marked;

                const cellBg = isSelected
                  ? accentColor
                  : approvedType === 'PRESENT'
                  ? '#10B981'
                  : approvedType === 'ABSENT'
                  ? '#EF4444'
                  : approvedType === 'OD'
                  ? '#3B82F6'
                  : approvedType === 'ML'
                  ? '#A855F7'
                  : isToday
                  ? (isDark ? '#374151' : '#FEF9C3')
                  : 'transparent';

                const textColor = (isSelected || approvedType)
                  ? '#FFFFFF'
                  : isSun
                  ? '#EF4444'
                  : isToday
                  ? '#D97706'
                  : isDisabled && !isPending
                  ? '#D1D5DB'
                  : (isDark ? '#FFFFFF' : '#111827');

                const shouldHaveCircle = isSelected || !!approvedType || isToday;

                return (
                  <View style={dayStyles.outer}>
                    <TouchableOpacity
                      onPress={() => !isDisabled && onPress && onPress(date)}
                      disabled={isDisabled && !canUndo}
                      style={[
                        dayStyles.cell,
                        { backgroundColor: cellBg },
                        shouldHaveCircle && { borderRadius: 20 },
                      ]}
                    >
                      {isUndoing ? (
                        <ActivityIndicator size="small" color={accentColor} />
                      ) : (
                        <Text style={[dayStyles.dayText, { color: textColor }]}>
                          {date.day}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Dot: pending requests (not yet approved) */}
                    {isPending && !approvedType && (
                      <View style={[dayStyles.dot, { backgroundColor: accentColor }]} />
                    )}
                    {/* Holiday dot */}
                    {hasDot && !isPending && !approvedType && (
                      <View style={[dayStyles.dot, { backgroundColor: marking?.dotColor || '#6B7280' }]} />
                    )}
                    {/* Lock icon: pending but past midnight cutoff */}
                    {isPending && !canUndo && !approvedType && (
                      <Lock size={8} color="#9CA3AF" style={{ marginTop: 1 }} />
                    )}
                  </View>
                );
              }}
            />

            {/* Leave info pill */}
            <View style={[styles.leavePill, { backgroundColor: accentBg, borderColor: accentLight }]}>
              <BookOpen size={16} color={accentColor} style={{ marginRight: 8 }} />
              <View>
                <Text style={[styles.leavePillTitle, { color: accentColor }]}>
                  {isOD ? 'OD Leave' : 'ML Leave'}{' '}
                  <Text style={styles.leavePillCode}>— {subject.code}</Text>
                </Text>
                <Text style={styles.leavePillSubject}>{subject.name}</Text>
              </View>
            </View>

            {/* Reason input */}
            <TextInput
              style={styles.reasonInput}
              placeholder={
                isOD
                  ? 'Reason — placement drive, industrial visit...'
                  : 'Reason — medical cert. no...'
              }
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
            />

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: selectedDates.length > 0 ? '#FED7AA' : '#F3F4F6' },
              ]}
              disabled={selectedDates.length === 0 || isSubmitting}
              onPress={handleSubmit}
            >
              <Text style={[
                styles.submitBtnText,
                { color: selectedDates.length > 0 ? '#92400E' : '#9CA3AF' },
              ]}>
                Confirm — {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── Toast snackbar ── */}
          {toastMsg && (
            <Animated.View
              style={[
                styles.toast,
                {
                  opacity: toastAnim,
                  transform: [{
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.toastText}>{toastMsg}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Correction Request Modal ── */}
      <Modal visible={correctionVisible} transparent animationType="fade" onRequestClose={() => setCorrectionVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.correctionOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCorrectionVisible(false)} />
          <View style={styles.correctionSheet}>
            <View style={styles.correctionHeader}>
              <View style={styles.correctionIconBg}>
                <RotateCcw color="#F97316" size={24} />
              </View>
              <Text style={styles.correctionTitle}>Request Correction</Text>
              <Text style={styles.correctionSubtitle}>
                Ask faculty to remove the incorrect {correctionType} entry for {correctionDate}.
              </Text>
            </View>

            <TextInput
              style={styles.reasonInput}
              placeholder="Why is this incorrect? (e.g. 'Marked by mistake')"
              placeholderTextColor="#9CA3AF"
              value={correctionReason}
              onChangeText={setCorrectionReason}
              multiline
              autoFocus
            />

            <View style={styles.correctionActions}>
              <TouchableOpacity
                style={[styles.correctionBtn, styles.correctionBtnCancel]}
                onPress={() => setCorrectionVisible(false)}
                disabled={correctionSubmitting}
              >
                <Text style={styles.correctionBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.correctionBtn, styles.correctionBtnSubmit, (!correctionReason.trim() || correctionSubmitting) && styles.correctionBtnDisabled]}
                onPress={handleCorrectionSubmit}
                disabled={!correctionReason.trim() || correctionSubmitting}
              >
                {correctionSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.correctionBtnSubmitText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: isDark ? '#1C1C1E' : '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    maxHeight: '92%',
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: isDark ? '#3A3A3C' : '#E5E7EB',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 24,
  },
  handleWrap: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: isDark ? '#FFFFFF' : '#111827',
    letterSpacing: -0.5,
  },
  dateBadge: {
    backgroundColor: '#FF5E00',
    borderRadius: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeMonth: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dateBadgeDay: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navArrow: {
    fontSize: 24,
    color: isDark ? '#FFFFFF' : '#374151',
    fontWeight: '600',
    lineHeight: 28,
  },
  navArrowDisabled: {
    color: '#9CA3AF',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : '#111827',
  },
  calendar: {
    borderRadius: 20,
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  legendLabel: {
    fontSize: 12,
    color: isDark ? '#9CA3AF' : '#6B7280',
    fontWeight: '600',
  },
  leavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  },
  leavePillTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  leavePillCode: {
    fontWeight: '900',
  },
  leavePillSubject: {
    fontSize: 13,
    color: isDark ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  reasonInput: {
    backgroundColor: isDark ? '#000000' : '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: isDark ? '#FFFFFF' : '#111827',
    marginBottom: 20,
    minHeight: 60,
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: isDark ? '#2C2C2E' : '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 99,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  correctionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  correctionSheet: {
    backgroundColor: isDark ? '#1C1C1E' : '#ffffff',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  correctionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  correctionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? 'rgba(255, 94, 0, 0.1)' : '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  correctionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: isDark ? '#FFFFFF' : '#111827',
    marginBottom: 8,
  },
  correctionSubtitle: {
    fontSize: 15,
    color: isDark ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  correctionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  correctionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctionBtnCancel: {
    backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6',
  },
  correctionBtnSubmit: {
    backgroundColor: '#FF5E00',
  },
  correctionBtnDisabled: {
    opacity: 0.5,
  },
  correctionBtnCancelText: {
    color: isDark ? '#FFFFFF' : '#4B5563',
    fontWeight: '700',
    fontSize: 16,
  },
  correctionBtnSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

const dayStyles = StyleSheet.create({
  // Outer wrapper: same fixed size for EVERY day cell — this is what fixes the misalignment
  outer: {
    width: 40,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  cell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});







