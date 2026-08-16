import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getAttendanceStatus } from '../utils/attendance.utils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AttendancePctRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const AttendancePctRing = ({
  percentage,
  size = 60,
  strokeWidth = 6,
}: AttendancePctRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isNoData = percentage === -1;
  const status = isNoData ? 'safe' : getAttendanceStatus(percentage);

  // Colors
  const colors = {
    safe: '#22C55E', // Green-500
    borderline: '#F59E0B', // Amber-500
    critical: '#EF4444', // Red-500
    severe: '#9F1239', // Rose-800
    gray: '#E2E8F0', // Gray-200 for no data
  };
  const color = isNoData ? colors.gray : colors[status as keyof typeof colors] || colors.critical;
  const bgColor = isNoData ? '#F8FAFC' : `${color}20`; // 20% opacity for background ring

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(isNoData ? 100 : percentage, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage, isNoData]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * animatedValue.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
