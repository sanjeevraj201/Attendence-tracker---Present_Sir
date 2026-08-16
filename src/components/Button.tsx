import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
}


export const Button = ({ 
  label, 
  variant = 'primary', 
  isLoading = false, 
  disabled, 
  onPress, 
  className = '',
  ...props 
}: ButtonProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    props.onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (disabled || isLoading) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primaryOrange text-white border-0';
      case 'secondary':
        return 'bg-gray-100 dark:bg-cardDark text-gray-900 dark:text-white border-0';
      case 'outline':
        return 'bg-transparent text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700';
      case 'ghost':
        return 'bg-transparent text-primaryOrange border-0';
    }
  };

  const variantStyles = getVariantStyles();
  const textStyles = variant === 'primary' ? 'text-white' : (variant === 'ghost' ? 'text-primaryOrange' : 'text-gray-900 dark:text-white');

  return (
    <Animated.View style={[rStyle, { width: '100%' }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || isLoading}
        className={`h-[56px] w-full rounded-[16px] items-center justify-center flex-row px-6 ${variantStyles} ${disabled || isLoading ? 'opacity-60' : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#FF5E00'} />
        ) : (
          <Text className={`font-bold font-sans text-base tracking-wide ${textStyles}`}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
