import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface ToastMessageProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export const ToastMessage = ({ message, type = 'info', onDismiss }: ToastMessageProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 1800);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-gray-800'
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className={`absolute top-12 self-center px-6 py-3 rounded-full shadow-md z-50 ${bgColors[type]}`}
      style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }}
    >
      <Text className="text-white font-sans text-sm font-medium">{message}</Text>
    </Animated.View>
  );
};
