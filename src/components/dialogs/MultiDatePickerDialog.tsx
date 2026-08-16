import React, { useState, forwardRef, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Calendar } from 'react-native-calendars';
import { getIndianPublicHolidays } from '../../utils/holiday.utils';

interface MultiDatePickerDialogProps {
  type: 'OD' | 'ML';
  onSave: (dates: string[], reason: string) => void;
  onClose: () => void;
}

export const MultiDatePickerDialog = forwardRef<BottomSheet, MultiDatePickerDialogProps>(
  ({ type, onSave, onClose }, ref) => {
    const snapPoints = useMemo(() => ['95%'], []);
    const [selectedDates, setSelectedDates] = useState<Record<string, { selected: boolean, selectedColor: string }>>({});
    const [reason, setReason] = useState('');
    const [holidays, setHolidays] = useState<Record<string, string>>({});

    useEffect(() => {
      setHolidays(getIndianPublicHolidays());
    }, []);

    const themeColor = type === 'OD' ? '#d97706' : '#d97706'; // Amber for both

    const toggleDate = (dateString: string) => {
      // Prevent selecting Sundays or Holidays
      const date = new Date(dateString);
      if (date.getDay() === 0) return; // Sunday
      if (holidays[dateString]) return; // Holiday

      setSelectedDates(prev => {
        const next = { ...prev };
        if (next[dateString]) {
          delete next[dateString];
        } else {
          next[dateString] = { selected: true, selectedColor: themeColor };
        }
        return next;
      });
    };

    const handleSave = () => {
      const dates = Object.keys(selectedDates).sort();
      if (dates.length === 0 || !reason) return;
      onSave(dates, reason);
      onClose();
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBehavior="extend"
        onClose={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
          <Text className="text-2xl font-bold font-sans text-gray-900 mb-2">
            Request {type === 'OD' ? 'On-Duty' : 'Medical Leave'}
          </Text>
          <Text className="text-sm text-gray-500 font-sans mb-6">
            Select the dates you will be absent. Sundays and public holidays are disabled.
          </Text>

          <View className="rounded-2xl overflow-hidden border border-gray-200 mb-6">
            <Calendar
              onDayPress={(day: any) => toggleDate(day.dateString)}
              markedDates={{
                ...selectedDates,
                // Mark holidays visually
                ...Object.keys(holidays).reduce((acc, date) => ({
                  ...acc,
                  [date]: { disabled: true, disableTouchEvent: true, dotColor: 'red', marked: true }
                }), {})
              }}
              theme={{
                todayTextColor: '#F97316',
                arrowColor: '#F97316',
                textDayFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textMonthFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayHeaderFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: 'bold',
              }}
            />
          </View>

          <Text className="text-xs font-bold text-gray-500 mb-1 ml-1 uppercase font-sans">Reason for {type}</Text>
          <TextInput
            className="bg-gray-50 rounded-xl p-4 font-sans border border-gray-100 min-h-[100px] mb-8"
            placeholder="Please provide a valid reason for approval..."
            multiline
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />

          <TouchableOpacity
            className={`h-14 rounded-full bg-primaryOrange items-center justify-center shadow-sm ${
              (Object.keys(selectedDates).length === 0 || !reason) ? 'opacity-50' : ''
            }`}
            disabled={Object.keys(selectedDates).length === 0 || !reason}
            onPress={handleSave}
          >
            <Text className="text-white font-bold font-sans text-lg">
              Submit Request ({Object.keys(selectedDates).length} days)
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

MultiDatePickerDialog.displayName = 'MultiDatePickerDialog';
