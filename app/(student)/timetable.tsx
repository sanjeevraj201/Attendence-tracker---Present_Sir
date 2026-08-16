import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimetableStore } from '../../src/stores/timetable.store';
import { useSubjectsStore } from '../../src/stores/subjects.store';
import { TimetableSlotCard } from '../../src/components/TimetableSlotCard';
import { TimeEditorSheet } from '../../src/components/dialogs/TimeEditorSheet';
import { SubjectSelectionSheet } from '../../src/components/dialogs/SubjectSelectionSheet';
import { Plus, CalendarDays, Coffee } from 'lucide-react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Helpers ───────────────────────────────────────────────────────────────
const minutesBetween = (from: string, to: string): number => {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return (th * 60 + tm) - (fh * 60 + fm);
};

const isSlotActive = (start: string, end: string, current: string): boolean => {
  return minutesBetween(start, current) >= 0 && minutesBetween(current, end) > 0;
};

const BreakCard = ({
  startTime, endTime, isDark,
}: { startTime: string; endTime: string; isDark: boolean }) => {
  const mins = minutesBetween(startTime, endTime);
  if (mins <= 0) return null;
  return (
    <View style={{ marginTop: 0, marginBottom: 0, alignItems: 'center', zIndex: -1 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255,94,0,0.08)' : 'rgba(255,94,0,0.07)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
      }}>
        <Coffee size={13} color="#FF5E00" />
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF5E00', marginLeft: 6 }}>
          {mins} min break
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: isDark ? '#9CA3AF' : '#6B7280', marginLeft: 6 }}>
          {startTime} – {endTime}
        </Text>
      </View>
    </View>
  );
};



const getInitialDay = () => {
  const idx = new Date().getDay();
  if (idx === 0) return 'Monday';
  return DAYS[idx - 1] || 'Monday';
};

const getTodayName = () => {
  const idx = new Date().getDay();
  if (idx === 0) return 'Sunday';
  return DAYS[idx - 1] || 'Monday';
};

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedDay,    setSelectedDay]    = useState(getInitialDay());
  const [editingSlotId,  setEditingSlotId]  = useState<string | null>(null);
  const [assigningSlotId, setAssigningSlotId] = useState<string | null>(null);

  // Track current time in HH:MM to determine active slot
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 10000); // Check every 10 seconds for snappiness
    return () => clearInterval(timer);
  }, []);

  const timeSheetRef    = useRef<BottomSheetModal>(null);
  const subjectSheetRef = useRef<BottomSheetModal>(null);

  const { timetable, addSlot, removeSlot, setSlotTime, assignSubject } = useTimetableStore();
  const subjects = useSubjectsStore(s => s.subjects);

  const daySlots = timetable
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.periodIndex - b.periodIndex);

  const editingSlot = timetable.find(s => s.id === editingSlotId);

  // ── Handlers ──────────────────────────────────────────────
  const handleAddSlot = () => {
    let start = '09:00';
    if (daySlots.length > 0) start = daySlots[daySlots.length - 1].endTime;
    const [h, m] = start.split(':').map(Number);
    const end = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    addSlot(selectedDay, start, end);
  };

  const handlePressTime = (id: string) => {
    setEditingSlotId(id);
    timeSheetRef.current?.present();
  };

  const handlePressSubject = (id: string) => {
    setAssigningSlotId(id);
    subjectSheetRef.current?.present();
  };

  // Colours — no NativeWind opacity shortcuts
  const pageBg     = isDark ? '#000000' : '#F2F2F7';
  const chipBg     = isDark ? '#1C1C1E' : '#FFFFFF';
  const chipBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const emptyBg    = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: pageBg }]}>

      {/* ── Header ─────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Timetable
          </Text>
          <Text style={styles.subtitle}>{selectedDay}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddSlot} activeOpacity={0.85}>
          <Plus color="#fff" size={18} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Day chips ──────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
        style={{ flexGrow: 0 }}
      >
        {DAYS.map(day => {
          const active = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? '#FF5E00' : chipBg,
                  borderColor:     active ? '#FF5E00' : chipBorder,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.chipText,
                { color: active ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') },
              ]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Slot list ──────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {daySlots.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: emptyBg, borderColor: chipBorder }]}>
            <CalendarDays color="#D1D5DB" size={40} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              No classes yet
            </Text>
            <Text style={styles.emptySub}>
              Tap "Add" to schedule your first period for {selectedDay}.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={handleAddSlot}
              activeOpacity={0.85}
            >
              <Plus color="#fff" size={18} style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddText}>Add Class</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {daySlots.map((slot, index) => {
              const prevSlot = daySlots[index - 1];
              const gapMins  = prevSlot ? minutesBetween(prevSlot.endTime, slot.startTime) : 0;
              const hasBreak = gapMins > 0;
              return (
                <React.Fragment key={slot.id}>
                  {/* Normal gap between consecutive slots */}
                  {index > 0 && !hasBreak && (
                    <View style={{ height: 0 }} />
                  )}
                  {/* Break card — 10px above (from wrapper marginTop) and 10px below (from wrapper marginBottom) */}
                  {hasBreak && (
                    <BreakCard
                      startTime={prevSlot!.endTime}
                      endTime={slot.startTime}
                      isDark={isDark}
                    />
                  )}
                  <TimetableSlotCard
                    slot={slot}
                    subject={subjects.find(s => s.id === slot.subjectId)}
                    isActive={
                      // Only show active if the selected tab is actually today
                      selectedDay === getTodayName() &&
                      isSlotActive(slot.startTime, slot.endTime, currentTime)
                    }
                    onDelete={removeSlot}
                    onPressSubject={handlePressSubject}
                    onPressTime={handlePressTime}
                  />
                </React.Fragment>
              );
            })}

            {/* Add more slots */}
            <TouchableOpacity
              style={[styles.addMoreBtn, {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              }]}
              onPress={handleAddSlot}
              activeOpacity={0.7}
            >
              <Plus color="#9CA3AF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.addMoreText}>Add Slot</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Sheets ─────────────────────────── */}
      <TimeEditorSheet
        ref={timeSheetRef}
        initialStartTime={editingSlot?.startTime || '09:00'}
        initialEndTime={editingSlot?.endTime   || '10:00'}
        onSave={(start, end, applyToAll, breakMins) => {
          if (editingSlotId) setSlotTime(editingSlotId, start, end, applyToAll, breakMins);
          timeSheetRef.current?.dismiss();
        }}
        onClose={() => setEditingSlotId(null)}
      />

      <SubjectSelectionSheet
        ref={subjectSheetRef}
        subjects={subjects}
        onSelectSubject={(subjectId) => {
          if (assigningSlotId) assignSubject(assigningSlotId, subjectId);
          subjectSheetRef.current?.dismiss();
        }}
        onSelectBreak={(title) => {
          if (assigningSlotId) useTimetableStore.getState().assignBreak(assigningSlotId, title);
          subjectSheetRef.current?.dismiss();
        }}
        onClose={() => setAssigningSlotId(null)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5E00',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  daysRow: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5E00',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 999,
  },
  emptyAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addMoreText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
});
