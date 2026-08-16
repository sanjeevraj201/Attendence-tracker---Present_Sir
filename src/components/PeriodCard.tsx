import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Subject, TimetableSlot, AttendanceType } from '../types/attendance.types';
import { MarkButton } from './MarkButton';
import { getSubjectIcon } from '../utils/subject.utils';
import { useColorScheme } from 'nativewind';
import { ActionConfirmModal } from './dialogs/ActionConfirmModal';

interface PeriodCardProps {
  slot: TimetableSlot;
  subject?: Subject;
  markedType?: AttendanceType;
  isWifiValid?: boolean;
  isWifiVerificationEnabled?: boolean;
  onMarkAttendance: (type: AttendanceType) => Promise<void> | void;
  onChangeAttendance?: (type: AttendanceType) => Promise<void> | void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const PeriodCard = ({ slot, subject, markedType, isWifiValid, isWifiVerificationEnabled, onMarkAttendance, onChangeAttendance }: PeriodCardProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingChangeType, setPendingChangeType] = useState<AttendanceType | null>(null);

  const shadowStyle = Platform.OS === 'ios' && !isDark
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 }
    : !isDark ? { elevation: 1 } : {};

  if (slot.isBreak || !subject) {
    return (
      <View 
        className="bg-gray-100/50 dark:bg-[#1A1A1C] rounded-[20px] p-5 mb-4 flex-row items-center justify-between border border-transparent dark:border-white/5"
      >
        <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 font-sans uppercase tracking-widest">{slot.startTime} - {slot.endTime}</Text>
        <Text className="text-[14px] text-gray-500 dark:text-gray-400 italic font-sans">{slot.title || 'Break'}</Text>
      </View>
    );
  }

  const Icon = getSubjectIcon(subject.name);

  const handleMark = async (type: AttendanceType) => {
    if (isProcessing) return;
    if (markedType === type) return;

    if (markedType) {
      setPendingChangeType(type);
      setConfirmVisible(true);
      return;
    }

    setIsProcessing(true);
    try {
      await onMarkAttendance(type);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeChange = async () => {
    setConfirmVisible(false);
    if (!pendingChangeType || !onChangeAttendance) return;
    
    setIsProcessing(true);
    try {
      await onChangeAttendance(pendingChangeType);
    } finally {
      setIsProcessing(false);
      setPendingChangeType(null);
    }
  };

  const isDisabled = isProcessing;

  return (
    <>
      <View 
        className="bg-white dark:bg-cardDark rounded-[24px] p-5 mb-4 border border-black/5 dark:border-white/5"
        style={shadowStyle}
      >
        <View className="flex-row items-center mb-5">
          <View className="w-12 h-12 rounded-full bg-primaryOrange/10 items-center justify-center mr-4">
            <Icon color="#FF5E00" size={24} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-lg font-black tracking-tight text-gray-900 dark:text-white font-sans mb-0.5">{subject.name}</Text>
            <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 font-sans tracking-wide">{slot.startTime} - {slot.endTime}</Text>
          </View>
        </View>

        <View className="flex-row justify-between mt-1">
          <MarkButton 
            label="P" 
            type="PRESENT" 
            isSelected={markedType === 'PRESENT'}
            disabled={isDisabled || markedType === 'PRESENT'}
            onPress={() => handleMark('PRESENT')} 
          />
          <MarkButton 
            label="A" 
            type="ABSENT" 
            isSelected={markedType === 'ABSENT'}
            disabled={isDisabled || markedType === 'ABSENT'}
            onPress={() => handleMark('ABSENT')} 
          />
          <MarkButton 
            label="OD" 
            type="OD" 
            isSelected={markedType === 'OD'}
            disabled={isDisabled || markedType === 'OD'}
            onPress={() => handleMark('OD')} 
          />
          <MarkButton 
            label="ML" 
            type="ML" 
            isSelected={markedType === 'ML'}
            disabled={isDisabled || markedType === 'ML'}
            onPress={() => handleMark('ML')} 
          />
        </View>
      </View>

      <ActionConfirmModal
        visible={confirmVisible}
        title="Change Attendance"
        message={`Your attendance is going to be changed from ${markedType} to ${pendingChangeType}. Would you like to proceed?`}
        confirmText="Change"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={executeChange}
        onCancel={() => {
          setConfirmVisible(false);
          setPendingChangeType(null);
        }}
      />
    </>
  );
};

