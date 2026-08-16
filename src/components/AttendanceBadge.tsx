import React from 'react';
import { View, Text } from 'react-native';
import { getAttendanceStatus } from '../utils/attendance.utils';

interface AttendanceBadgeProps {
  percentage: number | null;
}

export const AttendanceBadge = ({ percentage }: AttendanceBadgeProps) => {
  if (percentage === null) {
    return (
      <View className="rounded-2xl p-4 items-center justify-center border-2 bg-gray-50 border-gray-200">
        <Text className="text-3xl font-bold font-sans text-gray-400">
          --%
        </Text>
        <Text className="text-xs font-bold uppercase mt-1 font-sans text-gray-400">
          No Data
        </Text>
      </View>
    );
  }

  const status = getAttendanceStatus(percentage);
  
  const colors = {
    safe: 'bg-green-100 text-green-700 border-green-200',
    borderline: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
    severe: 'bg-rose-950 text-rose-100 border-rose-900' // very dark red
  };
  
  const labels = {
    safe: 'Safe',
    borderline: 'Borderline',
    critical: 'Critical',
    severe: 'Severe'
  };

  return (
    <View className={`rounded-2xl p-4 items-center justify-center border-2 ${colors[status].split(' ')[0]} ${colors[status].split(' ')[2]}`}>
      <Text className={`text-3xl font-bold font-sans ${colors[status].split(' ')[1]}`}>
        {percentage}%
      </Text>
      <Text className={`text-xs font-bold uppercase mt-1 font-sans ${colors[status].split(' ')[1]}`}>
        {labels[status]}
      </Text>
    </View>
  );
};
