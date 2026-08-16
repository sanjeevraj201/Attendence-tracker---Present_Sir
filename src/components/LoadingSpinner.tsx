import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
}

export const LoadingSpinner = ({ message, color = '#F97316' }: LoadingSpinnerProps) => {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <ActivityIndicator size="large" color={color} />
      {message && (
        <Text className="mt-4 text-gray-600 font-sans text-center">
          {message}
        </Text>
      )}
    </View>
  );
};
