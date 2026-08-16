import React, { forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { BookOpen, Clock, Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { TimetableSlot, Subject } from '../../types/attendance.types';

interface SlotActionSheetProps {
  slot: TimetableSlot | null;
  subject?: Subject;
  onAssignSubject: () => void;
  onEditTime: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const SlotActionSheet = forwardRef<BottomSheetModal, SlotActionSheetProps>(
  ({ slot, subject, onAssignSubject, onEditTime, onDelete, onClose }, ref) => {
    const snapPoints = useMemo(() => ['40%'], []);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const subjectLabel = subject ? subject.name : slot?.isBreak ? 'Break / Free' : 'Unassigned Slot';
    const timeLabel = slot ? `${slot.startTime} – ${slot.endTime}` : '';

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.45}
          />
        )}
        backgroundStyle={{ backgroundColor: sheetBg, borderRadius: 28 }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#3A3A3C' : '#D1D5DB',
          width: 40,
          height: 4,
        }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: separatorColor }]}>
          <View style={styles.headerText}>
            <Text
              style={[styles.slotTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}
              numberOfLines={1}
            >
              {subjectLabel}
            </Text>
            <Text style={styles.slotTime}>{timeLabel}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>

          {/* Assign / Change Subject */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}
            onPress={() => {
              (ref as any).current?.dismiss();
              onAssignSubject();
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,94,0,0.12)' }]}>
              <BookOpen color="#FF5E00" size={18} />
            </View>
            <View style={styles.actionLabel}>
              <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {subject ? 'Change Subject' : 'Assign Subject'}
              </Text>
              <Text style={styles.actionSub}>
                {subject ? `Currently: ${subject.name}` : 'No subject assigned yet'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: separatorColor }]} />

          {/* Edit Time */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}
            onPress={() => {
              (ref as any).current?.dismiss();
              onEditTime();
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Clock color="#3B82F6" size={18} />
            </View>
            <View style={styles.actionLabel}>
              <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Edit Time
              </Text>
              <Text style={styles.actionSub}>{timeLabel}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: separatorColor }]} />

          {/* Delete */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}
            onPress={() => {
              (ref as any).current?.dismiss();
              setTimeout(() => onDelete(), 300);
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Trash2 color="#EF4444" size={18} />
            </View>
            <View style={styles.actionLabel}>
              <Text style={[styles.actionTitle, { color: '#EF4444' }]}>
                Delete Slot
              </Text>
              <Text style={styles.actionSub}>Only this period will be removed</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Cancel */}
        <TouchableOpacity
          style={[styles.cancelBtn, {
            backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6',
            marginBottom: Platform.OS === 'ios' ? 32 : 20,
          }]}
          onPress={() => (ref as any).current?.dismiss()}
          activeOpacity={0.75}
        >
          <Text style={[styles.cancelText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Cancel
          </Text>
        </TouchableOpacity>

      </BottomSheetModal>
    );
  }
);

SlotActionSheet.displayName = 'SlotActionSheet';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerText: {
    gap: 3,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  actionsWrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionLabel: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  actionSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
