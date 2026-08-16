import React, { forwardRef, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Subject } from '../../types/attendance.types';
import { getSubjectIcon } from '../../utils/subject.utils';
import { Coffee, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface SubjectSelectionSheetProps {
  subjects: Subject[];
  onSelectSubject: (subjectId?: string) => void;
  onSelectBreak?: (title: string) => void;
  onClose: () => void;
}

export const SubjectSelectionSheet = forwardRef<BottomSheetModal, SubjectSelectionSheetProps>(
  ({ subjects, onSelectSubject, onSelectBreak, onClose }, ref) => {
    const snapPoints = useMemo(() => ['65%', '85%'], []);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [isEditingBreak, setIsEditingBreak] = useState(false);
    const [breakTitle, setBreakTitle] = useState('Lunch Break');

    const handleSelect = (id?: string) => {
      onSelectSubject(id);
      setIsEditingBreak(false);
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
        )}
        backgroundStyle={{ backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#ffffff', borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E7EB', width: 48, height: 5 }}
      >
        <View className="flex-1 pt-4 pb-8">
          <View className="px-7 mb-6">
            <Text className="text-[26px] font-black font-sans text-gray-900 dark:text-white tracking-tight">Assign Subject</Text>
            <Text className="text-[14px] text-gray-500 dark:text-gray-400 font-sans mt-1">Select a subject for this timetable slot</Text>
          </View>

          <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 40 }}>
            
            {/* Break / Free Period Option */}
            {isEditingBreak ? (
              <View className="p-5 bg-gray-50 dark:bg-oledBlack rounded-[24px] mb-8 border border-black/5 dark:border-white/5">
                <Text className="text-[14px] font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">Break Name</Text>
                <TextInput 
                  value={breakTitle}
                  onChangeText={setBreakTitle}
                  placeholder="e.g. Lunch Break"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  className="bg-white dark:bg-cardDark px-4 py-3.5 rounded-[16px] text-[16px] font-sans font-medium text-gray-900 dark:text-white border border-black/5 dark:border-white/5 mb-4"
                  autoFocus
                />
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    className="flex-1 py-3.5 rounded-[16px] items-center bg-gray-200 dark:bg-gray-800"
                    onPress={() => setIsEditingBreak(false)}
                  >
                    <Text className="text-gray-700 dark:text-gray-300 font-bold text-[15px]">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 py-3.5 rounded-[16px] items-center bg-primaryOrange"
                    onPress={() => {
                       onSelectBreak?.(breakTitle.trim() || 'Break');
                       setIsEditingBreak(false);
                    }}
                  >
                    <Text className="text-white font-bold text-[15px]">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                className="flex-row items-center p-5 bg-gray-50 dark:bg-oledBlack rounded-[24px] mb-8 border border-black/5 dark:border-white/5"
                onPress={() => setIsEditingBreak(true)}
                activeOpacity={0.7}
              >
                <View className="w-[52px] h-[52px] rounded-[16px] bg-white dark:bg-cardDark items-center justify-center mr-4 border border-black/5 dark:border-white/5 shadow-sm">
                  <Coffee color="#9CA3AF" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-black text-gray-900 dark:text-white font-sans tracking-tight mb-1">Free Period</Text>
                  <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-sans">Mark as a break or free time</Text>
                </View>
              </TouchableOpacity>
            )}

            <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase font-sans tracking-widest mb-4 ml-1">Your Subjects</Text>

            {subjects.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <Text className="text-gray-400 font-sans text-center">You haven't added any subjects yet. Go to the Subjects tab to add them.</Text>
              </View>
            ) : (
              subjects.map(subject => {
                const Icon = getSubjectIcon(subject.name);
                return (
                  <TouchableOpacity
                    key={subject.id}
                    className="flex-row items-center p-4 bg-white dark:bg-cardDark rounded-[24px] mb-4 border border-black/5 dark:border-white/5 shadow-sm"
                    onPress={() => handleSelect(subject.id)}
                    activeOpacity={0.7}
                  >
                    <View className="w-[52px] h-[52px] rounded-[16px] bg-primaryOrange/10 items-center justify-center mr-4 border border-black/5 dark:border-white/5">
                      <Icon color="#FF5E00" size={24} />
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="text-[17px] font-black text-gray-900 dark:text-white font-sans tracking-tight mb-1" numberOfLines={1}>{subject.name}</Text>
                      <Text className="text-[13px] font-black text-gray-400 dark:text-gray-500 font-sans uppercase tracking-widest">{subject.code}</Text>
                    </View>
                    <ChevronRight color="#D1D5DB" size={20} />
                  </TouchableOpacity>
                );
              })
            )}

          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  }
);

SubjectSelectionSheet.displayName = 'SubjectSelectionSheet';



