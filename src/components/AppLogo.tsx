import React from 'react';
import { View } from 'react-native';
import { Hand } from 'lucide-react-native';

export const AppLogo = ({ size = 64 }: { size?: number }) => {
  return (
    <View 
      className="bg-primaryOrange items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Hand size={size * 0.5} color="#FFFFFF" />
    </View>
  );
};
