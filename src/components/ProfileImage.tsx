import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface ProfileImageProps {
  uri?: string;
  name: string;
  size?: number;
}

export const ProfileImage = ({ uri, name, size = 48 }: ProfileImageProps) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View 
      className="bg-primaryOrange items-center justify-center rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text 
          className="text-white font-bold font-sans"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
};
