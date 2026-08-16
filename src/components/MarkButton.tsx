import React from 'react';
import { TouchableOpacity, Text, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { AttendanceType } from '../types/attendance.types';

import { CalendarDays } from 'lucide-react-native';

interface MarkButtonProps {
  label: string;
  type: AttendanceType;
  isSelected: boolean;
  onPress: (type: AttendanceType) => void;
  disabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const MarkButton = ({ label, type, isSelected, onPress, disabled = false }: MarkButtonProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(type);
  };

  const getStyleProps = () => {
    switch (type) {
      case 'PRESENT':
        return { bg: 'bg-[#F1F8F1] dark:bg-[#008000]/15', text: 'text-[#008000] dark:text-[#22C55E]', icon: null };
      case 'ABSENT':
        return { bg: 'bg-[#FFCDD2] dark:bg-[#C62828]/20', text: 'text-[#B71C1C] dark:text-[#EF4444]', icon: null };
      case 'OD':
        return { bg: 'bg-[#EEF4FF] dark:bg-[#3B82F6]/15', text: 'text-[#3B82F6] dark:text-[#60A5FA]', icon: <CalendarDays size={14} color="#60A5FA" style={{ marginRight: 6 }}  /> };
      case 'ML':
        return { bg: 'bg-[#F3E5F5] dark:bg-[#9C27B0]/15', text: 'text-[#9C27B0] dark:text-[#D946EF]', icon: <CalendarDays size={14} color="#D946EF" style={{ marginRight: 6 }}  /> };
      default:
        return { bg: 'bg-[#F5F5F5] dark:bg-cardDark', text: 'text-[#8E8E93]', icon: null };
    }
  };

  const { bg, text, icon } = getStyleProps();

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isSelected ? 0.6 : 1,
  }));

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[rStyle, { flex: 1, marginHorizontal: 4 }]}
    >
      <View className={`h-[44px] rounded-full flex-row items-center justify-center ${bg} ${disabled ? 'opacity-40' : ''}`}>
        {icon}
        <Text className={`font-sans text-[14px] font-bold tracking-wide ${text}`}>
          {label}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};
