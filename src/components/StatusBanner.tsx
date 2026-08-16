import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';

interface StatusBannerProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export const StatusBanner = ({ type, message }: StatusBannerProps) => {
  if (!message) return null;

  const bgColors = {
    error: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  };

  const textColors = {
    error: 'text-red-700',
    success: 'text-green-700',
    info: 'text-gray-700 dark:text-gray-300'
  };

  const Icon = type === 'error' ? AlertCircle : (type === 'success' ? CheckCircle2 : Info);
  const iconColor = type === 'error' ? '#b91c1c' : (type === 'success' ? '#15803d' : '#1d4ed8');

  return (
    <View className={`flex-row items-center p-3 rounded-xl border ${bgColors[type]} mb-4`}>
      <Icon size={20} color={iconColor} />
      <Text className={`ml-2 flex-1 font-sans ${textColors[type]}`}>
        {message}
      </Text>
    </View>
  );
};

